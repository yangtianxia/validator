import { mergeProperties } from '@txjs/merge-properties'
import { Validator, type ValidatorRules, type BaseTrigger } from './validator'

const instance = new Validator<BaseTrigger, string>()

const validator = Object.assign(
	(options: ValidatorRules<BaseTrigger>) => instance.init(options),
	instance
)

mergeProperties(validator, instance, Validator.prototype)

export type {
	ValidatorConfigObject,
	RuleType,
	ValidatorConfig,
	DefaultsValidatorRules,
	CustomValidatorRules,
	Rule,
	BaseTrigger,
	ValidatorRules,
	ValidatorRule,
	CustomValidatorFunction
} from './validator'

export * from './shared/formatTpl'

export { validator }
export default Validator