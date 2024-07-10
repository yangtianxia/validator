import { Validator, type CustomValidatorFunction, type ValidatorRules, type BaseTrigger } from './validator'

const instance = new Validator<BaseTrigger, CustomValidatorFunction, string>()

const validator = Object.assign(
	(options: ValidatorRules<BaseTrigger, CustomValidatorFunction>) => instance.init(options),
	instance
)

Object.setPrototypeOf(validator, Object.getPrototypeOf(instance))

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
