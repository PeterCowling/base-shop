import React from 'react';

function resolveStyle(style, fill) {
  if (!fill) return style;
  return {
    ...style,
    width: '100%',
    height: '100%',
    objectFit: style?.objectFit ?? 'cover',
  };
}

const ImageComponent = function Image({ src, alt = '', fill = false, style, ...rest }) {
  const finalStyle = resolveStyle(style, fill);
  const imgProps = {
    ...rest,
    src,
    alt,
    style: finalStyle,
  };
  return React.createElement('img', imgProps);
};

ImageComponent.displayName = 'NextImageMock';

export default jest.fn(ImageComponent).mockName('next/image.default');
