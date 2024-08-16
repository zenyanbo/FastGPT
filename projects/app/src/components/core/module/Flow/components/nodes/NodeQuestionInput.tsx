import React from 'react';
import { NodeProps } from 'reactflow';
import NodeCard from '../render/NodeCard';
import { FlowModuleItemType } from '@fastgpt/global/core/module/type.d';
import Container from '../modules/Container';

import RenderOutput from '../render/RenderOutput';

const QuestionInputNode = ({ data, selected }: NodeProps<FlowModuleItemType>) => {
  const { moduleId, outputs } = data;

  return (
    <NodeCard minW={'240px'} selected={selected} {...data}>
      <Container borderTop={'2px solid'} borderTopColor={'myGray.200'} textAlign={'end'}>
        <RenderOutput moduleId={moduleId} flowOutputList={outputs} />
      </Container>
    </NodeCard>
  );
};

export default React.memo(QuestionInputNode);
