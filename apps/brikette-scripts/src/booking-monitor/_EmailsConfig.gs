/**
 * Configuration for email layout, color schemes, and images (including AVIF fallback).
 */
const EmailsConfig = {
  bgColourBody: "#ffffff",
  hostelUrl: "http://www.hostel-positano.com",
  instagramUrl: "https://www.instagram.com/brikettepositano/",
  tiktokUrl: "https://www.tiktok.com/tag/hostelbrikettepositano",
  termsUrl: "https://docs.google.com/document/d/1d1nZUJfYQ22eOAqwL2C49BQbDRAAVAQaEZ9n-SGPKd4/edit?usp=sharing",

  // Images (PNG)
  criSignImg: "https://drive.google.com/uc?export=view&id=1rui6txmiCVQyjHjeeIy2mhBkVy8SUWoT",
  peteSignImg: "https://drive.google.com/uc?export=view&id=1I5JmosQCGJaZ8IhelaIMHGoRajdggRAv",
  hostelIconImg: "https://drive.google.com/uc?export=view&id=10tnNnRPv_Pkyd8Dpi0ZmA7wQuJbqyMxs",
  instagramImg: "https://drive.google.com/uc?export=view&id=162ppeYFiCYJHi0r7kWvMlTDoF55EW2nL",
  tiktokImg: "https://drive.google.com/uc?export=view&id=1UPQrHmjzT9eueAWBunLVy27oo6YJFzsu",

  // Images (AVIF)
  criSignImgAvif: "https://drive.google.com/uc?export=view&id=1Feprulv2wdfEPdLSvt4gNbqBuwQV-2pE",
  peteSignImgAvif: "https://drive.google.com/uc?export=view&id=1DaBrFp7xGwS7TKa9HJJ775hPPrNNHNb6",
  hostelIconImgAvif: "https://drive.google.com/uc?export=view&id=1GRga7agHHKy8e_qaGdMIDi8k9GvEyAaM",
  instagramImgAvif: "https://drive.google.com/uc?export=view&id=1fzjT7Y37yxnGfHlPHy0raFjRulbD4FL-",
  tiktokImgAvif: "https://drive.google.com/uc?export=view&id=1n7n3drroYmhBW4NK92Gc_yT0Jc1m1tNH",

  /**
   * Helper for providing an AVIF fallback.
   */
  getAvifFallbackImage(avifUrl, pngUrl, altText, styleStr = "") {
    return `
      <picture>
        <source srcset="${avifUrl}" type="image/avif">
        <source srcset="${pngUrl}" type="image/png">
        <img src="${pngUrl}" alt="${altText}" style="${styleStr}">
      </picture>
    `;
  },

  months: [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ],

  ColorSchemes: {
    yellow: {
      bgColourHeader: "#ffc107",
      bgColourMain: "#fff3cd",
      bgColourSignature: "#ffeeba",
      bgColourFooter: "#fff3cd",
      textColourMain: "#856404"
    }
  },

  ActivityColors: {
    1: "yellow"
  },

  getStyles(colors) {
    return {
      bodyStyle: `
        margin: 0;
        padding: 0;
        font-family: Arial, sans-serif;
        background-color: ${this.bgColourBody};
      `,
      contentStyle: `
        max-width: 600px;
        margin: auto;
      `,
      headerStyle: `
        background: ${colors.bgColourHeader};
        color: #fff;
        padding: 30px 25px 0 25px;
        height: 110px;
      `,
      headerInnerStyle: `
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
      `,
      headerTextStyle: `
        text-align: left;
        width: 80%;
      `,
      headerTitleStyle: `
        margin: 0;
        font-size: 24px;
        font-weight: bold;
      `,
      subHeaderTextStyle: `
        font-size: 20px;
        font-weight: bold;
        margin: 0;
      `,
      headerLogoStyle: `
        text-align: right;
        width: 20%;
        padding-top: 15px;
      `,
      logoImageStyle: `
        width: 50px;
        height: auto;
        display: block;
      `,
      mainContentStyle: `
        background-color: ${colors.bgColourMain};
        color: ${colors.textColourMain};
        padding: 20px 30px 30px 30px;
      `,
      paragraphStyle: `
        font-size: 1em;
        margin-bottom: 15px;
        line-height: 1.5;
      `,
      signatureSectionStyle: `
        background-color: ${colors.bgColourSignature};
        text-align: center;
      `,
      signatureTextStyle: `
        text-align: center;
        font-size: 14px;
        padding: 20px 0 30px 0;
      `,
      signatureImageStyle: `
        width: 200px;
      `,
      signatureNamesContainerStyle: `
        display: flex;
        justify-content: space-around;
        align-items: center;
        padding-bottom: 20px;
      `,
      signatureNameStyle: `
        width: 50%;
        text-align: center;
        font-size: 14px;
      `,
      footerInfoStyle: `
        background-color: ${colors.bgColourFooter};
        color: #000;
        padding: 30px;
        text-align: justify;
      `,
      linkStyle: `
        text-decoration: underline;
        color: #000;
      `,
      footerHeadingContainerStyle: `
        background-color: ${colors.bgColourFooter};
        color: #000;
        padding: 30px 0 15px 0;
        text-align: center;
      `,
      footerHeadingStyle: `
        width: 100%;
        text-align: center;
        font-weight: bold;
        margin: 0;
      `,
      socialLinksContainerStyle: `
        background-color: ${colors.bgColourFooter};
        color: #000;
        padding: 0 30px 30px 30px;
        display: flex;
        justify-content: space-around;
        align-items: center;
      `,
      socialLinkStyle: `
        text-align: center;
        width: 33%;
      `,
      socialIconStyle: `
        width: 50px;
        height: auto;
        margin-bottom: 10px;
      `,
      socialTextStyle: `
        font-weight: bold;
      `
    };
  },

  generateHeader(styles) {
    return `
      <div style="${styles.headerStyle}">
        <div style="${styles.headerInnerStyle}">
          <div style="${styles.headerTextStyle}">
            <p style="${styles.headerTitleStyle}">Hostel Bri&#8203;kett&#101;</p>
            <p style="${styles.subHeaderTextStyle}">Positano</p>
          </div>
          <div style="${styles.headerLogoStyle}">
            <a href="${this.hostelUrl}">
              ${
                this.getAvifFallbackImage(
                  this.hostelIconImgAvif,
                  this.hostelIconImg,
                  "Hostel Icon",
                  styles.logoImageStyle
                )
              }
            </a>
          </div>
        </div>
      </div>
    `;
  },

  generateSignature(styles) {
    return `
      <div style="${styles.signatureSectionStyle}">
        <div style="${styles.signatureTextStyle}">
          With warm regards,
        </div>
        <div style="${styles.signatureNamesContainerStyle}">
          <div style="${styles.signatureNameStyle}">
            ${
              this.getAvifFallbackImage(
                this.criSignImgAvif,
                this.criSignImg,
                "Cristiana's Signature",
                styles.signatureImageStyle
              )
            }
            <div>Cristiana Marzano Cowling</div>
            <div>Owner</div>
          </div>
          <div style="${styles.signatureNameStyle}">
            ${
              this.getAvifFallbackImage(
                this.peteSignImgAvif,
                this.peteSignImg,
                "Peter's Signature",
                styles.signatureImageStyle
              )
            }
            <div>Peter Cowling</div>
            <div>Owner</div>
          </div>
        </div>
      </div>
    `;
  },

  generateFooter(styles) {
    return `
      <div style="${styles.footerInfoStyle}">
        Book directly for exclusive benefits.
        <a href="${this.termsUrl}" style="${styles.linkStyle}">Terms and conditions</a> apply.
      </div>
      <div style="${styles.footerHeadingContainerStyle}">
        <p style="${styles.footerHeadingStyle}">Find out More about Us</p>
      </div>
      <div style="${styles.socialLinksContainerStyle}">
        <div style="${styles.socialLinkStyle}">
          <a href="${this.instagramUrl}">
            ${
              this.getAvifFallbackImage(
                this.instagramImgAvif,
                this.instagramImg,
                "Instagram",
                styles.socialIconStyle
              )
            }
          </a>
          <div style="${styles.socialTextStyle}">Instagram</div>
        </div>
        <div style="${styles.socialLinkStyle}">
          <a href="${this.hostelUrl}">
            ${
              this.getAvifFallbackImage(
                this.hostelIconImgAvif,
                this.hostelIconImg,
                "Hostel's Website",
                styles.socialIconStyle
              )
            }
          </a>
          <div style="${styles.socialTextStyle}">Hostel's Website</div>
        </div>
        <div style="${styles.socialLinkStyle}">
          <a href="${this.tiktokUrl}">
            ${
              this.getAvifFallbackImage(
                this.tiktokImgAvif,
                this.tiktokImg,
                "TikTok",
                styles.socialIconStyle
              )
            }
          </a>
          <div style="${styles.socialTextStyle}">TikTok</div>
        </div>
      </div>
    `;
  }
};
