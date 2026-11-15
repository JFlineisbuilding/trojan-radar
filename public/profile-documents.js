// Profile PDFs are read inside the browser. The original document is not uploaded.
export async function readProfileDocument(file){
 if(!file||file.size>5*1024*1024)throw Error('Choose a PDF or text file smaller than 5 MB.');
 let text='';
 if(file.type==='text/plain'||/\.txt$/i.test(file.name)){text=await file.text()}
 else if(file.type==='application/pdf'||/\.pdf$/i.test(file.name)){
  const pdfjs=await import('/vendor/pdf.mjs');pdfjs.GlobalWorkerOptions.workerSrc='/vendor/pdf.worker.mjs';
  const bytes=new Uint8Array(await file.arrayBuffer());if(new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')throw Error('This file is not a valid PDF.');
  let pdf;try{pdf=await pdfjs.getDocument({data:bytes,isEvalSupported:false,disableFontFace:true,useSystemFonts:false}).promise;const parts=[];for(let n=1;n<=Math.min(pdf.numPages,30);n++){const page=await pdf.getPage(n),content=await page.getTextContent();parts.push(content.items.map(i=>i.str||'').join(' '));if(parts.join(' ').length>30000)break}text=parts.join('\n')}catch(e){throw Error(e.name==='PasswordException'?'Use a PDF without a password.':'This PDF could not be read. Try a text PDF or paste your interests instead.')}finally{if(pdf)await pdf.destroy()}
 }else throw Error('Upload a PDF or .txt file. For LinkedIn, use Save to PDF.');
 text=text.replace(/\0/g,'').trim();if(text.length<20)throw Error('No readable text was found. Export a text PDF or describe your experience in your own words.');
 return {name:file.name.slice(0,200),text:text.slice(0,24000),characters:Math.min(text.length,24000),importedAt:new Date().toISOString()};
}
