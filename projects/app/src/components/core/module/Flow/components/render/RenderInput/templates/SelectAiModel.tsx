import React, { useCallback, useEffect } from 'react';
import type { RenderInputProps } from '../type';
import { onChangeNode } from '../../../../FlowProvider';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import SelectAiModel from '@/components/Select/SelectAiModel';
import { llmModelTypeFilterMap } from '@fastgpt/global/core/ai/constants';

const SelectAiModelRender = ({ item, inputs = [], moduleId }: RenderInputProps) => {
  const { llmModelList } = useSystemStore();

  const modelList = llmModelList
    .filter((model) => {
      if (!item.llmModelType) return true;
      const filterField = llmModelTypeFilterMap[item.llmModelType];
      if (!filterField) return true;
      //@ts-ignore
      return !!model[filterField];
    })
    .map((item) => ({
      model: item.model,
      name: item.name,
      maxResponse: item.maxResponse
    }));

  const onChangeModel = useCallback(
    (e: string) => {
      onChangeNode({
        moduleId,
        type: 'updateInput',
        key: item.key,
        value: {
          ...item,
          value: e
        }
      });

      // update max tokens
      const model = modelList.find((item) => item.model === e) || modelList[0];
      if (!model) return;

      onChangeNode({
        moduleId,
        type: 'updateInput',
        key: 'maxToken',
        value: {
          ...inputs.find((input) => input.key === 'maxToken'),
          markList: [
            { label: '100', value: 100 },
            { label: `${model.maxResponse}`, value: model.maxResponse }
          ],
          max: model.maxResponse,
          value: model.maxResponse / 2
        }
      });
    },
    [inputs, item, modelList, moduleId]
  );

  const list = modelList.map((item) => {
    return {
      value: item.model,
      label: item.name
    };
  });

  useEffect(() => {
    if (!item.value && list.length > 0) {
      onChangeModel(list[0].value);
    }
  }, [item.value, list, onChangeModel]);

  return (
    <SelectAiModel
      minW={'350px'}
      width={'100%'}
      value={item.value}
      list={list}
      onchange={onChangeModel}
    />
  );
};

export default React.memo(SelectAiModelRender);
