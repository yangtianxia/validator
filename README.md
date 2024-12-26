# @txjs/validator

这个版本已经归档，新版[🔗@txjs/validator](https://github.com/yangtianxia/txjs/tree/master/packages/validator)

> 安装方法默认npm

## 安装

```ts
npm i @txjs/validator
```

## 基础示例

```ts
import { validator } from '@txjs/validator'

const rules = validator({
  name: {
    required: true,
    minlength: 2,
    maxlength: 8
  }
})

// 规则内容
{
  "name": [
    {
      "ruleName": "required",
      "trigger": [
        "change",
        "blur"
      ],
      "validator": (_, $$$value) => {…}
    },
    {
      "ruleName": "minlength",
      "trigger": "blur",
      "validator": (_, $$$value) => {…}
    },
    {
      "ruleName": "maxlength",
      "trigger": "blur",
      "validator": (_, $$$value) => {…}
    }
  ]
}

```

## 校验字段配置 ValidatorRules\<Trigger\>

```ts
/** 自定义方法配置规则 */
interface CustomValidatorRule<Trigger> {
	trigger?: Trigger
	validator: CustomValidatorFunction
}

/** 内置规则 */
export type DefaultsValidatorRules<Trigger> =
	& Record<
		| 'number'
		| 'digits'
		| 'telephone'
		| 'email'
		| 'landline'
		| 'url'
		| 'xss',
		boolean | RuleType<boolean, 'default', Trigger>
	>
	& Record<
		| 'minlength'
		| 'maxlength'
		| 'min'
		| 'max',
		number | RuleType<number, 'default', Trigger>
	>
	& Record<
		| 'range'
		| 'rangelength',
		number[] | RuleType<number[], 'default', Trigger>
	>
	& {
		required: boolean | RuleType<boolean, 'select' | 'array' | 'default', Trigger>
		contains: any[] | RuleType<any[], 'default', Trigger>
	}

/** 暴露自定义规则 */
export declare interface CustomValidatorRules {
	[key: string]: any
}

type Rule<Trigger> =
	& CustomValidatorRules
	& Partial<DefaultsValidatorRules<Trigger>>
	& {
		/** 表单 label */
		label?: string
		/** 触发事件 */
		trigger?: Trigger
		/** 自定义规则 */
		custom?: CustomValidatorRule<Trigger>[]
	}
```

## 支持方法

#### 内置验证方法
  - required
  - number
  - digits
  - contains
  - minlength
  - maxlength
  - rangelength
  - min
  - max
  - range
  - xss
  - telephone
  - email
  - landline
  - url

#### add - 自定义验证方法

```ts
import { validator } from '@txjs/validator'

validator.add('custom-name', config: ValidatorConfig<Trigger>)
```
