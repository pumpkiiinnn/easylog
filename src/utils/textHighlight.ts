interface HighlightSegment {
  text: string;
  isHighlight: boolean;
}

export const highlightText = (text: string, searchText: string): HighlightSegment[] => {
  if (!searchText) return [{ text, isHighlight: false }];
  
  const segments: HighlightSegment[] = [];
  const searchLower = searchText.toLowerCase();
  let lastIndex = 0;
  
  while (true) {
    const index = text.toLowerCase().indexOf(searchLower, lastIndex);
    if (index === -1) {
      if (lastIndex < text.length) {
        segments.push({
          text: text.slice(lastIndex),
          isHighlight: false
        });
      }
      break;
    }
    
    if (index > lastIndex) {
      segments.push({
        text: text.slice(lastIndex, index),
        isHighlight: false
      });
    }
    
    segments.push({
      text: text.slice(index, index + searchText.length),
      isHighlight: true
    });
    
    lastIndex = index + searchText.length;
  }
  
  return segments;
}; 