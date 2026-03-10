'use client';

import { useTranslation } from 'react-i18next';

import MealOrderPage from '../../../components/meal-orders/MealOrderPage';

export default function ComplimentaryBreakfastPage() {
  const { t } = useTranslation('Homepage');
  // eslint-disable-next-line ds/no-hardcoded-copy -- PRIME-1: iconClassName is a Tailwind CSS design token, not UI copy
  return <MealOrderPage service="breakfast" title={t('mealOrder.breakfastTitle')} iconClassName="text-warning-foreground" />;
}
