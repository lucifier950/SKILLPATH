function FeatureCard(props){
    return(
        <div className="neu-card p-8 text-center">
            <div className="neu-icon w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-5">
                {props.icon}
            </div>
            <h3 className="text-xl font-bold mb-2 text-[var(--neu-text)]">{props.title}</h3>
            <p className="text-[var(--neu-text-soft)]">{props.text}</p>
        </div>
    );
}
export default FeatureCard