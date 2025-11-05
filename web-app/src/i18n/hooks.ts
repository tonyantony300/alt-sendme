import { useContext } from "react"
import { TranslationContext } from "./context"


export const useAppTranslation = () => useContext(TranslationContext)

