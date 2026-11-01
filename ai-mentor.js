import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';
import { readFile, writeFile } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";


const historyFile=new URL("./chat-history.json",import.meta.url)
 
let chatHistory = [];

const ai = new GoogleGenAI({
  apiKey:process.env.GOOGLE_API_KEY
});

try{
  const data = await readFile(historyFile,"utf-8");
  chatHistory=JSON.parse(data);

}catch(error){
  if(error.code !== "ENOENT"){
    throw error;
  }
}

//save chat history

const  saveHistory=async()=>{
  await writeFile(
    historyFile,
    JSON.stringify(chatHistory,null,2),
    "utf-8"
  );
}

const aiChat=async(message)=>{

  chatHistory.push({
    role:"user",
    parts:[{text:message}]
    });
try{
const response = await ai.models.generateContent({
  model: "gemini-3.5-flash-lite",
  contents:chatHistory,
  config:{
    systemInstruction:` You are an empathetic, wise, and highly practical AI Life and Career Mentor. Your role is to guide the user through life's challenges, family dynamics, academic pressures, and career growth. 

Tone: Warm, grounded, non-judgmental, and supportive—like a wise older sibling or a trusted friend.

Key Areas of Guidance:
1. Life & Mindset: Help the user build resilience, overcome self-doubt, manage daily stress, and stay motivated during tough times.
2. Family Dynamics: Provide balanced advice on handling family expectations, improving communication, and navigating emotional conflicts with empathy and respect.
3. Studies & Career: Offer actionable strategies for focus, time management, consistency, and tackling complex learning goals (like coding or problem-solving).
4. Everyday Problems: Assist in breaking down overwhelming real-life situations into small, manageable steps.

Rules for Interaction:
- Always validate the user's feelings first before giving advice. 
- Avoid toxic positivity, robotic responses, or overly philosophical lectures.
- Keep your advice practical, realistic, and step-by-step.
- When the user faces a complex problem, ask gentle, reflective questions to help them think clearly and find their own solutions.`,
   
  }

});

const answer=response.text;
chatHistory.push({
  role:"model",
  parts:[{text:answer}]
});
await saveHistory();
return answer;
}catch(err){
  chatHistory.pop();
  throw err;
}
}

const rl=createInterface({
  input:stdin,
  output:stdout
});

try {
       while(true){
        const message= (await rl.question("You: ")).trim();
        if(!message) continue;

        if(message.toLowerCase()==="/exit"){
          break;
        }
       
         
       try{
        const answer=await aiChat(message);
        console.log(`Mentor: ${answer}`);
       } catch(error){
        console.log("Error : ",error.message);
       }
      }

    } finally {
      rl.close();
    }

