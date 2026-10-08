import { TeachingTool } from '../types';

export const getToolEmbedUrl = (tool: TeachingTool): string => {
  let finalUrl = tool.url;
  
  if (finalUrl.includes('<iframe')) {
    const srcMatch = finalUrl.match(/src=["']([^"']+)["']/);
    if (srcMatch) {
      finalUrl = srcMatch[1];
    }
  }

  if (finalUrl && !/^https?:\/\//i.test(finalUrl) && !finalUrl.startsWith('/') && !finalUrl.startsWith('<') && !/^[a-zA-Z0-9]+$/.test(finalUrl)) {
    finalUrl = 'https://' + finalUrl;
  }

  if (tool.type === 'geogebra') {
    let ggbId = finalUrl;
    
    const isIdOnly = /^[a-zA-Z0-9]{4,}$/.test(ggbId) && !ggbId.includes('http');
    if (isIdOnly) {
       ggbId = ggbId;
    } else {
       const idMatch = ggbId.match(/\/(?:m|classic|calculator|geometry|3d|graphing|id)\/([a-zA-Z0-9]+)(?:\?|$)/);
       if (idMatch) {
         ggbId = idMatch[1];
       } else {
         const slashMatch = ggbId.match(/\/([a-zA-Z0-9]+)(?:\?|$)/);
         if (slashMatch && !ggbId.includes('geogebra.org/material/iframe')) {
           ggbId = slashMatch[1];
         }
       }
    }
    
    if (finalUrl.includes('geogebra.org/material/iframe')) {
        return finalUrl;
    } else if (finalUrl.includes('geogebra.org/classic/') && finalUrl.includes('embed')) {
        return finalUrl;
    } else {
        return `https://www.geogebra.org/material/iframe/id/${ggbId}/width/1280/height/720/border/888888/sfsb/true/smb/false/stb/false/stbh/false/ai/false/asb/false/sri/true/rc/false/ld/false/sdz/true/ctl/false`;
    }
  }

  return finalUrl;
};
