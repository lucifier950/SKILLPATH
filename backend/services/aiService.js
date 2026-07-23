import Groq from 'groq-sdk';
let groqInstance =null;
const getGroq =() =>{
    if(!groqInstance && process.env.GROQ_API_KEY){
        groqInstance= new Groq({ apiKey: process.env.GROQ_API_KEY});

    }
    return groqInstance;
};
const buildPrompt = (goal, level, weeklyHours) => `
    Act as a senior technical learning advisor.
    Generate a learning roadmap for someone who wants to learn "${goal}".
    Their current skill level is "${level}" and they can dedicate ${weeklyHours} hours per week.

    Return the response ONLY as a raw JSON object with this structure:
    {
      "estimatedDuration": "X weeks",
      "steps": [
        {
          "stepNumber": 1,
          "title": "Topic Name",
          "description": "Brief description of what to learn",
          "duration": "Y weeks",
          "resources": ["Keyword or Site 1", "Keyword 2"]
        }
      ]
    }
    Make sure the JSON is valid and contains no markdown formatting like \`\`\`json.
    `;

const parseRoadmapContent = (content) => {
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsedData = JSON.parse(cleaned);
    if (!parsedData.steps || !Array.isArray(parsedData.steps)) {
        throw new Error('Invalid JSON structure returned from AI');
    }
    return parsedData;
};

export const generateRoadmapWithAI = async(goal,level, weeklyHours)=>{
    const groq = getGroq();
    if(!groq){
        throw new Error('AI service is not configured');
    }
    const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: buildPrompt(goal, level, weeklyHours) }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
    });
    return parseRoadmapContent(completion.choices[0]?.message?.content || '{}');
};

// Scans partial JSON text and returns every COMPLETE step object found so far.
// String-aware brace matching, so braces inside descriptions don't break it.
const parseCompleteSteps = (text) => {
    const key = text.indexOf('"steps"');
    if (key === -1) return [];
    const arrayStart = text.indexOf('[', key);
    if (arrayStart === -1) return [];
    const steps = [];
    let depth = 0, objStart = -1, inString = false, escaped = false;
    for (let i = arrayStart + 1; i < text.length; i++) {
        const ch = text[i];
        if (escaped) { escaped = false; continue; }
        if (ch === '\\') { escaped = true; continue; }
        if (ch === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (ch === '{') {
            if (depth === 0) objStart = i;
            depth++;
        } else if (ch === '}') {
            depth--;
            if (depth === 0 && objStart !== -1) {
                try {
                    steps.push(JSON.parse(text.slice(objStart, i + 1)));
                } catch {
                    // object closed but not valid JSON yet — skip until more text arrives
                }
                objStart = -1;
            }
        } else if (ch === ']' && depth === 0) {
            break;
        }
    }
    return steps;
};

// Async generator: streams Groq tokens, yields semantic events as the JSON takes shape,
// and finally yields the full raw text for validation + persistence.
export async function* streamRoadmapEvents(goal, level, weeklyHours) {
    const groq = getGroq();
    if (!groq) {
        throw new Error('AI service is not configured');
    }
    const stream = await groq.chat.completions.create({
        messages: [{ role: 'user', content: buildPrompt(goal, level, weeklyHours) }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        stream: true,
    });
    let text = '';
    let emitted = 0;
    let metaSent = false;
    for await (const chunk of stream) {
        text += chunk.choices[0]?.delta?.content || '';
        if (!metaSent) {
            const m = text.match(/"estimatedDuration"\s*:\s*"([^"]*)"/);
            if (m) {
                metaSent = true;
                yield { type: 'meta', estimatedDuration: m[1] };
            }
        }
        const steps = parseCompleteSteps(text);
        while (emitted < steps.length) {
            yield { type: 'step', step: steps[emitted], index: emitted };
            emitted++;
        }
    }
    yield { type: 'complete', data: parseRoadmapContent(text) };
}

const buildExplainPrompt = (goal, level, step) => `
    Act as a friendly senior mentor. Your student is learning "${goal}" (current level: ${level})
    and has reached the roadmap step "${step.title}": ${step.description}

    Explain this step in markdown with EXACTLY these four sections:
    ## What it really is
    ## Why it matters for ${goal}
    ## How to practice this week
    ## Watch out

    Keep the whole answer under 250 words. Use short paragraphs and "- " bullets,
    bold the key terms with **double asterisks**, and speak directly to the student as "you".
    No preamble, no code fences, no headings other than the four above.
    `;

// Async generator: yields raw markdown text deltas for a single step explanation.
export async function* streamStepExplanation(goal, level, step) {
    const groq = getGroq();
    if (!groq) {
        throw new Error('AI service is not configured');
    }
    const stream = await groq.chat.completions.create({
        messages: [{ role: 'user', content: buildExplainPrompt(goal, level, step) }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.5,
        stream: true,
    });
    for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || '';
        if (text) yield text;
    }
}