import GanttApp from '@/components/GanttApp';
import { I18nProvider } from '@/i18n/I18nProvider';

export default function Home() {
  return (
    <I18nProvider>
      <GanttApp />
    </I18nProvider>
  );
}
