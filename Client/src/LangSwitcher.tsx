import {useTranslation} from 'react-i18next'

const lngs = {
    en: {name: "English"},
    ar: {name: "Arabic"},
    fr: {name: "Français"}
};

function LangSwitcher(){
    const {t, i18n} = useTranslation()
    return <div>
        <label htmlFor="lang_select">{t('Language')} </label>
        <select id="lang_select" onChange={(e)=>{
                //console.log(e)
                i18n.changeLanguage(e.target.value)
            }}
            value={i18n.resolvedLanguage}
        >
        {
            Object.keys(lngs).map((lng,ind)=>{
                return <option key={ind} value={lng}>{lngs[lng].name}</option>
            })
        }
        </select>
    </div>;
}

export default LangSwitcher;