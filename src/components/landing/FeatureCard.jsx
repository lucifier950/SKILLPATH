function FeatureCard(props){
    return(
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm">
            <h3 className="text-xl font-bold mb-2">{props.title}</h3>
            <p className="text-gray-600">{props.text}</p>
        </div>
    );
}
export default FeatureCard