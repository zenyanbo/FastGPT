import type { moduleDispatchResType } from '@fastgpt/global/core/chat/type.d';
import type { ModuleDispatchProps } from '@fastgpt/global/core/module/type.d';
import { ModuleOutputKeyEnum } from '@fastgpt/global/core/module/constants';

export type PluginOutputProps = ModuleDispatchProps<{
  [key: string]: any;
}>;
export type PluginOutputResponse = {
  [ModuleOutputKeyEnum.responseData]: moduleDispatchResType;
};

export const dispatchPluginOutput = (props: PluginOutputProps): PluginOutputResponse => {
  const { params } = props;

  return {
    responseData: {
      totalPoints: 0,
      pluginOutput: params
    }
  };
};
