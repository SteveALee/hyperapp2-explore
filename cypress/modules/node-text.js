// get the text node(s) content of the element - not child elements
export function getTextOfElement($element, depth) {
  let ret = $element
    .contents()
    .filter((_, content) => {
      return content.nodeType === Node.TEXT_NODE
    })
    .map((_, content) => {
      return content.data.trim()
    })
    .toArray()
    .join(' ')

  if (depth > 0) {
    const children = element.children()
    if (children.length) {
      ret += ' ' + getTextOfElement(children, --depth)
    }
  }

  return ret.trim()
}

// expect a node(s) text node(s) content
export const haveElementText = text => $element => {
  const txt = getTextOfElement($element)
  expect(txt, 'textNode').eq(text)
}
