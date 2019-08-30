
const H = require('./helper.js');
const Asset = H.depJs('lib/asset.js');

describe("Asset", () => {

  it("getNameByLink", () => {
    const link = 'https://a.org/foo.jpg';
    const nameA = Asset.getNameByLink({link: link});
    H.assertMatch(nameA, /^[^\.\/]+\.jpg$/);

    const nameB = Asset.getNameByLink({link: link, mimeType: 'image/png'});
    H.assertMatch(nameB, /\.jpg$/);
  });

  it("getNameByLink with extension", () => {
    const link = 'https://a.org/foo.jpg';
    const name = Asset.getNameByLink({link: link, extension: 'txt'});
    H.assertMatch(name, /^[^\.\/]+\.txt$/);
  });

  it("getNameByLink with prefix", () => {
    const link = 'https://a.org/foo.jpg';
    const name = Asset.getNameByLink({link: link, prefix: '001'});
    H.assertMatch(name, /^001-[^\.\/]+\.jpg$/);
  });

  it("getNameByLink with mimeType", () => {
    const link = 'https://a.org/foo';
    const name = Asset.getNameByLink({link: link, mimeType: 'image/jpeg'});
    H.assertMatch(name, /^[^\.\/]+\.jpg$/);
  });

  it("getNameByLink - link doesn't has an extension", () => {
    const link = 'https://a.org/foo';
    const name = Asset.getNameByLink({link: link, mimeType: undefined});
    H.assertMatch(name, /^[^\.\/]+$/);
  })

  it("getNameByLink = data link", () => {
    const link = 'data:image/png;base64,imagedata';
    const nameA = Asset.getNameByLink({link: link, mimeType: 'image/jpeg'});
    H.assertMatch(nameA, /^[^\.\/]+\.png$/);

    const nameB = Asset.getNameByLink({link: link, extension: 'ico'});
    H.assertMatch(nameB, /^[^\.\/]+\.png$/);
  });

});

