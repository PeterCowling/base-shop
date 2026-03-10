'use client';

import { useTranslation } from 'react-i18next';

import MealOrderPage from '../../../components/meal-orders/MealOrderPage';

export default function ComplimentaryEveningDrinkPage() {
  const { t } = useTranslation('Homepage');
  return <MealOrderPage service="drink" title={t('mealOrder.eveningDrinkTitle')} iconClassName="text-accent" />;
}
