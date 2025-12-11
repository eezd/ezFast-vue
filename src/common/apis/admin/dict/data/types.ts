export interface DictDataQuery extends PageQuery {
  dictName: string
  dictType: string
  dictLabel: string

}

export interface DictDataVO extends BaseEntity {
  dictCode: string
  dictLabel: string
  dictValue: string
  cssClass: string
  listClass: ElTagType
  dictSort: number
  remark: string
}

export interface DictDataForm {
  dictType?: string
  dictCode: number | string
  dictLabel: string
  dictValue: string
  cssClass: string
  listClass: ElTagType
  dictSort: number
  remark: string
}
