import { stripHtml } from '../../src/utils/html';

describe('stripHtml', () => {
  it('removes tags and decodes common entities', () => {
    expect(stripHtml('<p>Hello <strong>world</strong></p>')).toBe('Hello world');
    expect(stripHtml('Tom &amp; Jerry &lt;3')).toBe('Tom & Jerry <3');
  });

  it('collapses whitespace', () => {
    expect(stripHtml('<div>  one   two  </div>')).toBe('one two');
  });
});
