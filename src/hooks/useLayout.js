import { useWindowDimensions } from 'react-native';

export const useLayout = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  return {
    isDesktop,
    isMobile: !isDesktop,
    width,
    pad: isDesktop ? 24 : 16,
    cols: isDesktop ? 2 : 1,
  };
};
