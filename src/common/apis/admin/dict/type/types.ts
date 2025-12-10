export interface DictTypeVO extends BaseEntity {
  dictId: number | string
  dictName: string
  dictType: string
  remark: string
}

export interface DictTypeForm {
  dictId: number | string
  dictName: string
  dictType: string
  remark: string
}

export interface DictTypeQuery extends PageQuery {
  dictName?: string
  dictType?: string
  params?: {
    beginTime?: string
    endTime?: string
  }
}
