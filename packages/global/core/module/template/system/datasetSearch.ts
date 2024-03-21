import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  FlowNodeTypeEnum
} from '../../node/constant';
import { FlowNodeTemplateType } from '../../type.d';
import {
  ModuleIOValueTypeEnum,
  ModuleInputKeyEnum,
  ModuleOutputKeyEnum,
  FlowNodeTemplateTypeEnum
} from '../../constants';
import { Input_Template_Switch, Input_Template_UserChatInput } from '../input';
import { Output_Template_Finish, Output_Template_UserChatInput } from '../output';
import { DatasetSearchModeEnum } from '../../../dataset/constants';

export const DatasetSearchModule: FlowNodeTemplateType = {
  id: FlowNodeTypeEnum.datasetSearchNode,
  templateType: FlowNodeTemplateTypeEnum.functionCall,
  flowType: FlowNodeTypeEnum.datasetSearchNode,
  avatar: '/imgs/module/db.png',
  name: '知识库搜索',
  intro: '调用知识库搜索能力，查找“有可能”与问题相关的内容',
  showStatus: true,
  isTool: true,
  inputs: [
    Input_Template_Switch,
    {
      key: ModuleInputKeyEnum.datasetSelectList,
      type: FlowNodeInputTypeEnum.selectDataset,
      label: 'core.module.input.label.Select dataset',
      value: [],
      valueType: ModuleIOValueTypeEnum.selectDataset,
      list: [],
      required: true,
      showTargetInApp: false,
      showTargetInPlugin: true
    },
    {
      key: ModuleInputKeyEnum.datasetSimilarity,
      type: FlowNodeInputTypeEnum.selectDatasetParamsModal,
      label: '',
      value: 0.4,
      valueType: ModuleIOValueTypeEnum.number,
      showTargetInApp: false,
      showTargetInPlugin: false
    },
    {
      key: ModuleInputKeyEnum.datasetMaxTokens,
      type: FlowNodeInputTypeEnum.hidden,
      label: '',
      value: 1500,
      valueType: ModuleIOValueTypeEnum.number,
      showTargetInApp: false,
      showTargetInPlugin: false
    },
    {
      key: ModuleInputKeyEnum.datasetSearchMode,
      type: FlowNodeInputTypeEnum.hidden,
      label: '',
      valueType: ModuleIOValueTypeEnum.string,
      showTargetInApp: false,
      showTargetInPlugin: false,
      value: DatasetSearchModeEnum.embedding
    },
    {
      key: ModuleInputKeyEnum.datasetSearchUsingReRank,
      type: FlowNodeInputTypeEnum.hidden,
      label: '',
      valueType: ModuleIOValueTypeEnum.boolean,
      showTargetInApp: false,
      showTargetInPlugin: false,
      value: false
    },
    {
      key: ModuleInputKeyEnum.datasetSearchUsingExtensionQuery,
      type: FlowNodeInputTypeEnum.hidden,
      label: '',
      valueType: ModuleIOValueTypeEnum.boolean,
      showTargetInApp: false,
      showTargetInPlugin: false,
      value: true
    },
    {
      key: ModuleInputKeyEnum.datasetSearchExtensionModel,
      type: FlowNodeInputTypeEnum.hidden,
      label: '',
      valueType: ModuleIOValueTypeEnum.string,
      showTargetInApp: false,
      showTargetInPlugin: false
    },
    {
      key: ModuleInputKeyEnum.datasetSearchExtensionBg,
      type: FlowNodeInputTypeEnum.hidden,
      label: '',
      valueType: ModuleIOValueTypeEnum.string,
      showTargetInApp: false,
      showTargetInPlugin: false,
      value: ''
    },
    {
      ...Input_Template_UserChatInput,
      toolDescription: '需要检索的内容'
    }
  ],
  outputs: [
    Output_Template_UserChatInput,
    {
      key: ModuleOutputKeyEnum.datasetIsEmpty,
      label: 'core.module.output.label.Search result empty',
      type: FlowNodeOutputTypeEnum.source,
      valueType: ModuleIOValueTypeEnum.boolean,
      targets: []
    },
    {
      key: ModuleOutputKeyEnum.datasetUnEmpty,
      label: 'core.module.output.label.Search result not empty',
      type: FlowNodeOutputTypeEnum.source,
      valueType: ModuleIOValueTypeEnum.boolean,
      targets: []
    },
    {
      key: ModuleOutputKeyEnum.datasetQuoteQA,
      label: 'core.module.Dataset quote.label',
      type: FlowNodeOutputTypeEnum.source,
      valueType: ModuleIOValueTypeEnum.datasetQuote,
      targets: []
    },
    Output_Template_Finish
  ]
};
