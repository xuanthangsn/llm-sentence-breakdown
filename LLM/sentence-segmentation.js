require('dotenv').config();

const {OpenAI} = require('openai');


const sentence_segmentation = async (text, targetLang) => {
    const system_prompt = "You are a sentence segmentation and translation tool. You will be provided with a text of any language." +
                          `You task is to segment the text into sentences and translate each sentence into ${targetLang}.` +
                          "For each segmented sentence, create a JSON object with the following key: " + '\n' +
                          "- **sentence**: the segmented sentence" + '\n' +
                          "- **translation**: the translation of the sentence in " + targetLang + '\n' +
                          "Format your response as a JSON array containing these JSON objects. The JSON ouput should be compact, with no extra indentation or whitespace. Do not include any additional commentary or information.";
    
    const client = new OpenAI();       
        
    let response
    try {
        response = await client.chat.completions.create({
            model: "gpt-4o",  
            messages: [
                { role: "system", content: system_prompt }, 
                {role: "user", content: text}
            ],
        });
        
    } catch (error) {
        console.error(error);
        throw new Error("Failed to generate response from OpenAI");
    }
  
    try {
        let breakdown = JSON.parse(response.choices[0].message.content);
        return breakdown;
    }
    catch (error) {
        console.error(error);
        throw new Error("Failed to parse response from OpenAI");
    }

}



module.exports = sentence_segmentation;