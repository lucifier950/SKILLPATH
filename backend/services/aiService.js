import Groq from 'groq-sdk';
let groqInstance =null;
const getGroq =() =>{
    if(!groqInstance && process.env.GROQ_API_KEY){
        groqInstance= new Groq({ apiKey: process.env.GROQ_API_KEY});

    }
    return groqInstance;
};
export const generateRoadmapWithAI = async(goal,level, weeklyHours)=>{
    const groq = getGroq();
    if(!groq){
        throw new Error('AI service is not configured');
    }
    const prompt =`
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
     const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
    });

    let content = completion.choices[0]?.message?.content || '{}';
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const parsedData = JSON.parse(content);
    if (!parsedData.steps || !Array.isArray(parsedData.steps)) {
        throw new Error('Invalid JSON structure returned from AI');
    }
    return parsedData;
};