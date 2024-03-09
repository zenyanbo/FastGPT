import type { LLMModelItemType } from '../ai/model.d';
import { AppTypeEnum } from './constants';
import { AppSchema, AppSimpleEditFormType } from './type';

export type CreateAppParams = {
  name?: string;
  avatar?: string;
  type?: `${AppTypeEnum}`;
  modules: AppSchema['modules'];
};

export interface AppUpdateParams {
  name?: string;
  type?: `${AppTypeEnum}`;
  simpleTemplateId?: string;
  avatar?: string;
  intro?: string;
  modules?: AppSchema['modules'];
  permission?: AppSchema['permission'];
  teamTags?: AppSchema['teamTags'];
}

export type FormatForm2ModulesProps = {
  formData: AppSimpleEditFormType;
  chatModelMaxToken: number;
  llmModelList: LLMModelItemType[];
};
