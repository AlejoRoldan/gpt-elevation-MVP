// DT-002 — i18n
import { useLanguage } from '../../i18n/useLanguage'

export function AdminContent() {
  const { t } = useLanguage()
  return (
    <div>
      <h1 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 400, fontSize: '1.8rem', color: '#1C1917', marginBottom: '0.5rem' }}>
        {t('admin_content')}
      </h1>
      <p style={{ fontSize: '0.875rem', color: '#78716C' }}>{t('admin_platform_overview')}</p>
    </div>
  )
}
