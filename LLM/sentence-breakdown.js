require('dotenv').config();

const {OpenAI} = require('openai');
const client = new OpenAI();   

const sentence_breakdown = (text, targetLang) => {
    let system_prompt = "You are a sentence breakdown and translation tool. You will be provided a **sentence **(of any language) and **targeted language** as input. You should perform the following tasks:\n" + 
                          "- **overall translation**: provide the overall translation of the provided sentence into the targeted language.\n" +
                          "- **sentence break down**: break down the provided sentence into multiple components and ignore punctuation and provide the translation for each component. Each component must be a lexical unit of the language. For each component, create a JSON object with the following keys: **text**: <the exact text of the component>; **meaning**: <the meaning of the component in the targeted language>.\n" +
                          "Return your output as a JSON object with the following keys:\n" +
                          "- **translation**: translation of the provided sentence into the targeted language.\n" +
                          "- **components**: list of the JSON objects represents the broken down components.\n" +
                          "The JSON ouput should be compact, with no extra indentation or whitespace. Do not include any additional commentary or information.";



    const user_prompt = `Sentence: '${text}';Targeted language:  ${targetLang}.`;


    const example = "Here is an example you can refer to: \n" +
                    "Input: \n"+
                    "Sentence: 'Therefore, the committee, following due process, affirmed the proposed amendments to the existing bylaws.';Targeted language:  Vietnamese. \n"  +
                    "Output: \n" +
                    '{"translation":"Do đó, ủy ban, sau khi tuân thủ quy trình thích hợp, đã xác nhận các sửa đổi được đề xuất đối với điều lệ hiện hành.","components":[{"text":"Therefore","meaning":"Do đó"},{"text":"the committee","meaning":"ủy ban"},{"text":"following","meaning":"sau khi"},{"text":"due process","meaning":"quy trình thích hợp"},{"text":"affirmed","meaning":"đã xác nhận"},{"text":"the proposed amendments","meaning":"các sửa đổi được đề xuất"},{"text":"to","meaning":"đối với"},{"text":"the existing bylaws","meaning":"điều lệ hiện hành"}]}'


    system_prompt = system_prompt + "\n\n" + example; 
    return new Promise(async (resolve, reject) => {
        let response
        try {
            response = await client.chat.completions.create({
                model: "gpt-4o",  
                messages: [
                    { role: "system", content: system_prompt }, 
                    {role: "user", content: user_prompt}
                ],
            });
            
        } catch (error) {
            console.error(error);
            return reject(new Error("Failed to generate response from OpenAI"));
        }
      
        try {
            let breakdown = JSON.parse(response.choices[0].message.content);
            return resolve(breakdown);
        }
        catch (error) {
            console.error(error);
            return reject(new Error("Failed to parse response from OpenAI"));
        }

    });
                    
}


module.exports = sentence_breakdown;