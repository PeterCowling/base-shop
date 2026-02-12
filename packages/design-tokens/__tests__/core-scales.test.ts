import {
  type Container,
  containers,
  type LetterSpacing,
  letterSpacing,
  type Opacity,
  opacity,
  type Size,
  sizes,
} from '../src/index.ts';

describe('Core Token Scales', () => {
  describe('opacity', () => {
    it('exports all expected keys', () => {
      const expectedKeys = ['0', '5', '10', '20', '25', '30', '40', '50', '60', '70', '75', '80', '90', '95', '100'];
      expect(Object.keys(opacity).sort()).toEqual(expectedKeys.sort());
    });

    it('has string values', () => {
      for (const value of Object.values(opacity)) {
        expect(typeof value).toBe('string');
      }
    });

    it('has correct decimal values', () => {
      expect(opacity[0]).toBe('0');
      expect(opacity[5]).toBe('0.05');
      expect(opacity[50]).toBe('0.5');
      expect(opacity[100]).toBe('1');
    });

    it('exports Opacity type', () => {
      const key: Opacity = '50';
      expect(opacity[key]).toBe('0.5');
    });
  });

  describe('letterSpacing', () => {
    it('exports all expected keys', () => {
      const expectedKeys = ['tighter', 'tight', 'normal', 'wide', 'wider', 'widest'];
      expect(Object.keys(letterSpacing).sort()).toEqual(expectedKeys.sort());
    });

    it('has string values', () => {
      for (const value of Object.values(letterSpacing)) {
        expect(typeof value).toBe('string');
      }
    });

    it('has correct em values', () => {
      expect(letterSpacing.tighter).toBe('-0.05em');
      expect(letterSpacing.tight).toBe('-0.025em');
      expect(letterSpacing.normal).toBe('0em');
      expect(letterSpacing.wide).toBe('0.025em');
      expect(letterSpacing.wider).toBe('0.05em');
      expect(letterSpacing.widest).toBe('0.1em');
    });

    it('exports LetterSpacing type', () => {
      const key: LetterSpacing = 'normal';
      expect(letterSpacing[key]).toBe('0em');
    });
  });

  describe('sizes', () => {
    it('exports all expected keys', () => {
      const expectedKeys = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', 'full', 'screen'];
      expect(Object.keys(sizes).sort()).toEqual(expectedKeys.sort());
    });

    it('has string values', () => {
      for (const value of Object.values(sizes)) {
        expect(typeof value).toBe('string');
      }
    });

    it('has correct rem and special values', () => {
      expect(sizes.xs).toBe('20rem');
      expect(sizes.sm).toBe('24rem');
      expect(sizes.md).toBe('28rem');
      expect(sizes.lg).toBe('32rem');
      expect(sizes.xl).toBe('36rem');
      expect(sizes['2xl']).toBe('42rem');
      expect(sizes['7xl']).toBe('80rem');
      expect(sizes.full).toBe('100%');
      expect(sizes.screen).toBe('100vw');
    });

    it('exports Size type', () => {
      const key: Size = 'md';
      expect(sizes[key]).toBe('28rem');
    });
  });

  describe('containers', () => {
    it('exports all expected keys', () => {
      const expectedKeys = ['sm', 'md', 'lg', 'xl', '2xl'];
      expect(Object.keys(containers).sort()).toEqual(expectedKeys.sort());
    });

    it('has string values', () => {
      for (const value of Object.values(containers)) {
        expect(typeof value).toBe('string');
      }
    });

    it('has correct px values', () => {
      expect(containers.sm).toBe('640px');
      expect(containers.md).toBe('768px');
      expect(containers.lg).toBe('1024px');
      expect(containers.xl).toBe('1280px');
      expect(containers['2xl']).toBe('1536px');
    });

    it('exports Container type', () => {
      const key: Container = 'lg';
      expect(containers[key]).toBe('1024px');
    });
  });
});
