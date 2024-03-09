import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  ModalFooter,
  ModalBody,
  Flex,
  Switch,
  Input,
  Textarea
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import MyModal from '@/components/MyModal';
import { DYNAMIC_INPUT_KEY, ModuleIOValueTypeEnum } from '@fastgpt/global/core/module/constants';
import { useTranslation } from 'next-i18next';
import { FlowValueTypeMap } from '@/web/core/modules/constants/dataType';
import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum
} from '@fastgpt/global/core/module/node/constant';
import { EditInputFieldMap, EditNodeFieldType } from '@fastgpt/global/core/module/node/type.d';
import { useToast } from '@fastgpt/web/hooks/useToast';
import MySelect from '@fastgpt/web/components/common/MySelect';

const FieldEditModal = ({
  editField = {
    key: true,
    name: true,
    description: true,
    dataType: true
  },
  defaultField,
  keys = [],
  onClose,
  onSubmit
}: {
  editField?: EditInputFieldMap;
  defaultField: EditNodeFieldType;
  keys: string[];
  onClose: () => void;
  onSubmit: (e: { data: EditNodeFieldType; changeKey: boolean }) => void;
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const isCreate = useMemo(() => !defaultField.key, [defaultField.key]);
  const showDynamicInputSelect =
    !keys.includes(DYNAMIC_INPUT_KEY) || defaultField.key === DYNAMIC_INPUT_KEY;

  const inputTypeList = [
    {
      label: t('core.module.inputType.target'),
      value: FlowNodeInputTypeEnum.target,
      valueType: ModuleIOValueTypeEnum.string
    },
    {
      label: t('core.module.inputType.input'),
      value: FlowNodeInputTypeEnum.input,
      valueType: ModuleIOValueTypeEnum.string
    },
    {
      label: t('core.module.inputType.textarea'),
      value: FlowNodeInputTypeEnum.textarea,
      valueType: ModuleIOValueTypeEnum.string
    },
    {
      label: t('core.module.inputType.switch'),
      value: FlowNodeInputTypeEnum.switch,
      valueType: ModuleIOValueTypeEnum.boolean
    },
    {
      label: t('core.module.inputType.selectDataset'),
      value: FlowNodeInputTypeEnum.selectDataset,
      valueType: ModuleIOValueTypeEnum.selectDataset
    },
    ...(showDynamicInputSelect
      ? [
          {
            label: t('core.module.inputType.dynamicTargetInput'),
            value: FlowNodeInputTypeEnum.addInputParam,
            valueType: ModuleIOValueTypeEnum.any
          }
        ]
      : [])
  ];

  const dataTypeSelectList = Object.values(FlowValueTypeMap)
    .slice(0, -2)
    .map((item) => ({
      label: t(item.label),
      value: item.value
    }));

  const { register, getValues, setValue, handleSubmit, watch } = useForm<EditNodeFieldType>({
    defaultValues: defaultField
  });
  const inputType = watch('inputType');
  const outputType = watch('outputType');
  const valueType = watch('valueType');
  const [refresh, setRefresh] = useState(false);

  const showDataTypeSelect = useMemo(() => {
    if (!editField.dataType) return false;
    if (inputType === FlowNodeInputTypeEnum.target) return true;
    if (outputType === FlowNodeOutputTypeEnum.source) return true;

    return false;
  }, [editField.dataType, inputType, outputType]);

  const showRequired = useMemo(() => {
    if (inputType === FlowNodeInputTypeEnum.addInputParam) return false;

    return editField.required;
  }, [editField.required, inputType]);

  const showNameInput = useMemo(() => {
    return editField.name;
  }, [editField.name]);

  const showKeyInput = useMemo(() => {
    if (inputType === FlowNodeInputTypeEnum.addInputParam) return false;

    return editField.key;
  }, [editField.key, inputType]);

  const showDescriptionInput = useMemo(() => {
    return editField.description;
  }, [editField.description]);

  return (
    <MyModal
      isOpen={true}
      iconSrc="/imgs/module/extract.png"
      title={t('core.module.edit.Field Edit')}
      onClose={onClose}
    >
      <ModalBody overflow={'visible'}>
        {/* input type select: target, input, textarea.... */}
        {editField.inputType && (
          <Flex alignItems={'center'} mb={5}>
            <Box flex={'0 0 70px'}>{t('core.module.Input Type')}</Box>
            <MySelect
              w={'288px'}
              list={inputTypeList}
              value={getValues('inputType')}
              onchange={(e: string) => {
                const type = e as `${FlowNodeInputTypeEnum}`;
                const selectedItem = inputTypeList.find((item) => item.value === type);
                setValue('inputType', type);
                setValue('valueType', selectedItem?.valueType);

                if (type === FlowNodeInputTypeEnum.selectDataset) {
                  setValue('label', selectedItem?.label);
                } else if (type === FlowNodeInputTypeEnum.addInputParam) {
                  setValue('label', t('core.module.valueType.dynamicTargetInput'));
                  setValue('key', DYNAMIC_INPUT_KEY);
                  setValue('required', false);
                }

                setRefresh(!refresh);
              }}
            />
          </Flex>
        )}
        {showRequired && (
          <Flex alignItems={'center'} mb={5}>
            <Box flex={'0 0 70px'}>{t('common.Require Input')}</Box>
            <Switch {...register('required')} />
          </Flex>
        )}
        {showDataTypeSelect && (
          <Flex mb={5} alignItems={'center'}>
            <Box flex={'0 0 70px'}>{t('core.module.Data Type')}</Box>
            <MySelect
              w={'288px'}
              list={dataTypeSelectList}
              value={getValues('valueType')}
              onchange={(e: string) => {
                const type = e as `${ModuleIOValueTypeEnum}`;
                setValue('valueType', type);

                if (
                  type === ModuleIOValueTypeEnum.chatHistory ||
                  type === ModuleIOValueTypeEnum.datasetQuote
                ) {
                  const label = dataTypeSelectList.find((item) => item.value === type)?.label;
                  setValue('label', label);
                }

                setRefresh(!refresh);
              }}
            />
          </Flex>
        )}
        {showNameInput && (
          <Flex mb={5} alignItems={'center'}>
            <Box flex={'0 0 70px'}>{t('core.module.Field Name')}</Box>
            <Input placeholder="预约字段/sql语句……" {...register('label', { required: true })} />
          </Flex>
        )}
        {showKeyInput && (
          <Flex mb={5} alignItems={'center'}>
            <Box flex={'0 0 70px'}>{t('core.module.Field key')}</Box>
            <Input
              placeholder="appointment/sql"
              {...register('key', {
                required: true,
                onChange: (e) => {
                  const value = e.target.value;
                  if (!showNameInput) {
                    setValue('label', value);
                  }
                }
              })}
            />
          </Flex>
        )}
        {showDescriptionInput && (
          <Flex mb={5} alignItems={'flex-start'}>
            <Box flex={'0 0 70px'}>{t('core.module.Field Description')}</Box>
            <Textarea placeholder={t('common.choosable')} rows={3} {...register('description')} />
          </Flex>
        )}
      </ModalBody>

      <ModalFooter>
        <Button variant={'whiteBase'} mr={3} onClick={onClose}>
          {t('common.Close')}
        </Button>
        <Button
          onClick={handleSubmit((data) => {
            if (!data.key) return;
            if (isCreate && keys.includes(data.key)) {
              return toast({
                status: 'warning',
                title: t('core.module.edit.Field Already Exist')
              });
            }
            onSubmit({
              data,
              changeKey: !keys.includes(data.key)
            });
          })}
        >
          {t('common.Confirm')}
        </Button>
      </ModalFooter>
    </MyModal>
  );
};

export default React.memo(FieldEditModal);
