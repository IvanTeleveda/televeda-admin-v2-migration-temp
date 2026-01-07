import '@testing-library/jest-dom';

if (!window.matchMedia) {
    window.matchMedia = (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mocking Ant Design's getComputedStyle and rc-util usage
window.HTMLElement.prototype.scrollIntoView = jest.fn();
window.getComputedStyle = jest.fn(() => ({
  getPropertyValue: () => '',
  // Add the properties required by CSSStyleDeclaration to avoid TypeScript errors
})) as unknown as (elt: Element, pseudoElt?: string | null) => CSSStyleDeclaration;
