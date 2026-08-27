type ExtractedJob = {title:string;url:string;company:string;location:string;description:string};

function clean(value:string){return value.replace(/\s+/g," ").trim()}
function firecrawlUrl(){return process.env.FIRECRAWL_URL?.replace(/\/$/,"")}
function challenge(text:string){return /verifying your browser|incident id|radware page|captcha|access denied/i.test(text)}

export function isFirecrawlConfigured(){return Boolean(firecrawlUrl())}

export async function searchWeb(query:string):Promise<ExtractedJob[]>{
  const base=firecrawlUrl();
  if(!base)throw new Error("Firecrawl is not configured.");
  const response=await fetch(`${base}/v2/search`,{method:"POST",headers:{"content-type":"application/json",...(process.env.FIRECRAWL_API_KEY?{authorization:`Bearer ${process.env.FIRECRAWL_API_KEY}`}:{})},body:JSON.stringify({query:`${query} job openings hiring vacancies careers`,limit:30}),signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw new Error(`Firecrawl returned HTTP ${response.status}.`);
  const payload=await response.json() as {success?:boolean;data?:{web?:Array<{url?:string,title?:string,description?:string,markdown?:string}>}};
  return (payload.data?.web??[]).filter(item=>item.url&&item.title).map(item=>({title:clean(item.title??""),url:item.url??"",company:"Web search",location:"",description:clean(item.description??item.markdown??"")})).filter(item=>/job|career|vacanc|hiring|position|opening|employ/i.test(`${item.title} ${item.url} ${item.description}`)&&!/(npmjs|github\.com\/[^/]+\/[^/]+|stackoverflow|w3schools|country-picker)/i.test(`${item.title} ${item.url}`));
}

export async function scrapePublicSource(source:{name:string;base_url:string}):Promise<ExtractedJob[]>{
  const base=firecrawlUrl();
  if(!base)throw new Error("Firecrawl is not configured.");
  const response=await fetch(`${base}/v2/scrape`,{
    method:"POST",
    headers:{"content-type":"application/json",...(process.env.FIRECRAWL_API_KEY?{authorization:`Bearer ${process.env.FIRECRAWL_API_KEY}`}:{})},
    body:JSON.stringify({url:source.base_url,formats:["markdown"]}),
    signal:AbortSignal.timeout(30000),
  });
  if(!response.ok)throw new Error(`Firecrawl returned HTTP ${response.status}.`);
  const payload=await response.json() as {success?:boolean;data?:{markdown?:string}};
  const markdown=payload.data?.markdown??"";
  if(!payload.success||!markdown)throw new Error("Firecrawl returned no page content.");
  if(challenge(markdown))throw new Error("The source returned a browser-verification page.");
  const jobs:ExtractedJob[]=[];
  const pattern=/\[([^\]]{4,160})\]\((https?:\/\/[^)]+)\)/gi;
  let match:RegExpExecArray|null;
  while((match=pattern.exec(markdown))&&jobs.length<100){
    const title=clean(match[1]);
    const url=match[2].replace(/[),.]+$/g,"");
    if(!/^https:\/\//i.test(url)||!/(\/job\/|\/jobs\/|job-listing|stellenangebote|vacanc|career)/i.test(url))continue;
    if(/^(view details?|read more|learn more|apply now)$/i.test(title))continue;
    jobs.push({title,url,company:source.name,location:"",description:title});
  }
  return jobs;
}
