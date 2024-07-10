import _defaults from './defaults'
import { omit } from '@txjs/shared'
import { notNil, isPlainObject, isNil, isValidString, isFunction, isArray, isPromise } from '@txjs/bool'
import { formatTpl } from './shared/formatTpl'

type TriggerText = 'change' | 'blur'

interface BaseValidatorFunc {
	(value: any, param?: any, type?: any): boolean
}

interface Tpl extends Record<string, string> {
	readonly default: string
}

/** 基础验证配置 */
interface BaseValidatorConfig<T> {
	/** 注入内容值 */
	inject?: boolean
	/** 触发事件 */
	trigger?: T
	/** 预设方法 */
	preset: BaseValidatorFunc | BaseValidatorFunc[]
	/** 提示文案 */
	tpl: string | Tpl
}

export interface ValidatorConfig<T> extends BaseValidatorConfig<T> {
	/** 替换定义 */
	replace?: boolean
}

/** 自定义函数 */
export interface CustomValidatorFunction {
	(value: any, rule: any): Promise<void> | void
}

/** 自定义方法配置规则 */
interface CustomValidatorRule<T, F> {
	trigger?: T
	validator: F
}

export type BaseTrigger = TriggerText | TriggerText[]

/** 定义规则方法 */
export interface RuleType<
	Value = any,
	Type = string,
	Trigger = BaseTrigger
> {
	value: Value
	type?: Type
	message?: string
	trigger?: Trigger
}

/** 内置规则 */
export type DefaultsValidatorRules<T> =
	& Record<
		| 'number'
		| 'digits'
		| 'telephone'
		| 'email'
		| 'landline'
		| 'url'
		| 'xss',
		boolean | RuleType<boolean, 'default', T>
	>
	& Record<
		| 'minlength'
		| 'maxlength'
		| 'min'
		| 'max',
		number | RuleType<number, 'default', T>
	>
	& Record<
		| 'range'
		| 'rangelength',
		number[] | RuleType<number[], 'default', T>
	>
	& {
		required: boolean | RuleType<boolean, 'select' | 'array' | 'default', T>
		contains: any[] | RuleType<any[], 'default', T>
	}

/** 暴露自定义规则 */
export declare interface CustomValidatorRules {
	[key: string]: any
}

export type RuleDataType =
	| 'string'
	| 'number'
	| 'boolean'
	| 'method'
	| 'regexp'
	| 'integer'
	| 'float'
	| 'object'
	| 'enum'
	| 'date'
	| 'url'
	| 'hex'
	| 'email'

export type Rule<T, F> =
	& CustomValidatorRules
	& Partial<DefaultsValidatorRules<T>>
	& {
		/** 字段类型 */
		type?: RuleDataType
		/** 表单 label */
		label?: string
		/** 触发事件 */
		trigger?: T
		/** 自定义规则 */
		custom?: CustomValidatorRule<T, F>[]
	}

/** 验证配置 */
export type ValidatorConfigObject<T> = Record<string, ValidatorConfig<T>>

export type ValidatorRules<T, F> = Record<string, Rule<T, F>>

export type ValidatorRule<T, F, M> = {
	type?: RuleDataType
	trigger?: T
	ruleName?: string
	message?: M
	validator: F
}

export class Validator<T extends BaseTrigger, F extends CustomValidatorFunction, M> {
	private defaults: ValidatorConfigObject<T> = _defaults as any
	#trigger = 'blur' as T

  constructor (config?: ValidatorConfigObject<T>) {
		if (notNil(config)) {
			for (const name in config) {
				this.add(name, config[name])
			}
		}
	}

	init(options: ValidatorRules<T, F>) {
		const rules = {} as Record<string, ValidatorRule<T, F, M>[]>
		for (const key in options) {
			rules[key] = this.generate(key, options[key])
		}
		return rules
	}

	setTrigger(value: T) {
		this.#trigger = value
	}

	trigger(values: any): T {
		return values
	}

	transform(
		ruleName: string,
		{
			value,
			type,
			label,
			trigger,
			rule,
			tpl
		}: {
			value: any,
			type?: RuleDataType
			label?: string
			trigger: T,
			rule: Omit<Rule<T, F>, 'type' | 'label' | 'trigger' | 'custom'>,
			tpl: {
				type: string
				value?: string
			}
		},
		plan: ValidatorConfig<T>
	): ValidatorRule<T, F, M> {
		trigger = this.trigger(trigger)
		return {
			type,
			ruleName,
			trigger,
			validator: ((_: any, $$$value: unknown) => {
				return new Promise<void>((resolve, reject) => {
					// 忽略不是必须项且不是有效值
					// 忽略值为false
					if ((isNil(rule.required) && !isValidString($$$value)) || value === false) {
						resolve()
					} else {
						if (
							(isFunction(plan.preset) && !plan.preset($$$value, value, tpl.type)) ||
							(isArray(plan.preset) && !plan.preset.every((preset) => preset($$$value, value, tpl.type)))
						) {
							reject(
								new Error(
									formatTpl(
										tpl.value || (isPlainObject(plan.tpl) ? plan.tpl[tpl.type] : plan.tpl),
										plan.inject ? $$$value : value,
										label
									)
								)
							)
						} else {
							resolve()
						}
					}
				})
			}) as unknown as F
		}
	}

	tranformCustom(
		ruleName: string,
		validator: F,
		{
			type,
			label,
			trigger,
			rule
		}: {
			type?: RuleDataType
			label?: string
			trigger: T,
			rule: Omit<Rule<T, F>, 'type' | 'label' | 'trigger' | 'custom'>
		}
	): ValidatorRule<T, F, M> {
		trigger = this.trigger(trigger)
		return {
			type,
			ruleName,
			trigger,
			validator: ((_: any, $$$value: unknown) => {
				return new Promise<void>((resolve, reject) => {
					if (isNil(rule.required) && !isValidString($$$value)) {
						resolve()
					} else {
						const result = validator(_, $$$value)
						if (isPromise(result)) {
							result
								.then(resolve)
								.catch((err: Error) => {
									reject(
										new Error(
											formatTpl(err.message, undefined, label)
										)
									)
								})
						} else {
							resolve()
						}
					}
				})
			}) as unknown as F
		}
	}

	private generate(fieldKey: string, rule: Rule<T, F>) {
		if (!isPlainObject(rule)) {
			throw new Error(`"${fieldKey}" 必须是对象`)
		}

		const $$rules = [] as ValidatorRule<T, F, M>[]
		const $$custom = rule.custom
		const $$type = rule.type || 'string' as const
		const $$label = rule.label
		const $$rule = omit(rule, [
			'type',
			'label',
			'trigger',
			'custom'
		])

		for (const name in $$rule) {
			if (!(name in this.defaults)) {
				console.warn(`"${name}" 方法不存在，可以使用 "add" 方法添加`)
				continue
			}

			const plan = this.defaults[name]

			// 当前规则配置
			const ruleOption = $$rule[name as keyof typeof $$rule]!
			// 触发事件
			let $$$trigger = rule.trigger ?? plan.trigger ?? this.#trigger
			// 规则值
			let $$$value = ruleOption
			// 消息类型
			let tplType = 'default'
			// 消息文案
			let tplValue: string | undefined

			// 配置规则设置
			if (isPlainObject(ruleOption)) {
				const {
					type,
					message,
					value,
					trigger
				} = ruleOption as RuleType<any, string, T>

				// tpl 类型设置
				if (notNil(type)) {
					if (isPlainObject(plan.tpl) && type in plan.tpl) {
						tplType = type
					} else {
						console.warn(`"${name}" 不支持tpl "${type}"，默认规则未设置或不存在`)
					}
				}

				if (notNil(message)) {
					tplValue = message
				}

				if (notNil(value)) {
					$$$value = value
				} else {
					console.warn(`${name} 规则 "value" 值不能为空`)
				}

				if (notNil(trigger)) {
					$$$trigger = trigger
				}
			}

			$$rules.push(
				this.transform(name, {
					rule: $$rule,
					type: $$type,
					label: $$label,
					value: $$$value,
					trigger: $$$trigger,
					tpl: {
						type: tplType,
						value: tplValue
					}
				}, plan)
			)
		}

		if (isArray($$custom)) {
			const len = $$custom.length

			for (let i = 0; i < len; i++) {
				const { trigger, validator } = $$custom[i]

				if (isNil(validator)) {
					throw new Error(`"${fieldKey}" 自定义验证 "${i}" 必须有 "validator" 方法`)
				}

				if (!isFunction(validator)) {
					throw new Error(`"${fieldKey}" 自定义验证 "[${i}]validator" 必须是function`)
				}

				const $$$trigger = trigger || this.#trigger

				$$rules.push(
					this.tranformCustom(`${fieldKey}-custom-${i}`, validator, {
						type: $$type,
						rule: $$rule,
						label: $$label,
						trigger: $$$trigger
					})
				)
			}
		}

		return $$rules
	}

	add(
		name: string,
		config: ValidatorConfig<T>
	) {
		if (!config.replace && name in this.defaults) {
			console.warn(`"${name}" 方法已存在，可以添加属性 "replace" 的值为 "true" 来替换`)
		}

		this.defaults[name] = config
	}
}
