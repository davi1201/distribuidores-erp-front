import { Mapping, NfeItem } from './types';

export const generateInitialMappings = (products: NfeItem[]): Record<number, Mapping> => {
  const initialMappings: Record<number, Mapping> = {};
  products.forEach((item) => {
    initialMappings[item.index] = {
      action: item.suggestedAction === 'LINK_XML_INDEX' ? 'LINK_XML_INDEX' : item.suggestedAction,
      targetIndex: item.suggestedTargetIndex,
      markup: 100, // Default Markup
    };
  });
  return initialMappings;
};
