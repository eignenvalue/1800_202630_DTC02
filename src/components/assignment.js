import { marked } from "marked";
const markdownText = `
# Assignment Questions
---
**Instructions:**
<br>
After watching the video, answer all of the questions below in full sentences. Type your answers in a document (for example, Word or Google Docs), then save or export it as a **PDF**. Include your name and the assignment title at the top of the document before submitting.

1. What was the main topic of this video?
2. List three key points the video covered.
3. What is one new term or idea you learned, and what does it mean?
`;
let output = marked.parse(markdownText);
console.log(output)
document.getElementById("assignment-content").innerHTML = output
