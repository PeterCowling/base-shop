import { deriveText } from "../../src/send";

describe("deriveText", () => {
  it("strips HTML, style/script blocks, decodes entities and normalizes whitespace", () => {
    const html = `<style>p{color:red}</style><script>alert('x')</script><div> Hello&nbsp;world &amp; &lt;test&gt; &#39;quote&#39; &quot;double&quot; </div>`;
    const text = deriveText(html);
    expect(text).toBe("Hello world & <test> 'quote' \"double\"");
  });
});
