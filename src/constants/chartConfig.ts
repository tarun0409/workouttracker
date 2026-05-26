import { Dimensions } from 'react-native';
import { colors } from './colors';

export const CHART_WIDTH = Dimensions.get('window').width - 32;

export const chartConfig = {
  backgroundColor: colors.surface,
  backgroundGradientFrom: colors.surface,
  backgroundGradientTo: colors.surface,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(249, 115, 22, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.6})`,
  style: { borderRadius: 12 },
  propsForDots: { r: '5', strokeWidth: '2', stroke: colors.accent },
  barPercentage: 0.6,
  propsForBackgroundLines: { stroke: colors.border },
};
