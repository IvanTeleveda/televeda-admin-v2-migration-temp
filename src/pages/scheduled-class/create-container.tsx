import {
  Button,
  Skeleton,
} from "@pankod/refine-antd";
import { useEffect } from "react";
import { SnippetsOutlined } from '@ant-design/icons';
import { Create, CreateButtonProps, Edit, SaveButton } from "@refinedev/antd";

interface IMutateContainerProps {
  saveButtonProps: CreateButtonProps;
  action: string;
  isFormLoading: boolean;
  isTemplateBtnDisabled: boolean;
  createTemplate: () => void
}

export default function MutateContainer(props: React.PropsWithChildren<IMutateContainerProps>) {

  useEffect(() => {
    console.log("MutateContainer created");
  }, []);

  if (props.action == 'create')
    return (
      <Create
        title={<></>}
        goBack={<></>}
        headerButtons={<></>}
        breadcrumb={<></>}
        footerButtons={() => (
          <>
            <Button icon={<SnippetsOutlined />} disabled={props.isTemplateBtnDisabled} onClick={() => props.createTemplate()} type="primary">Create Template</Button>
            <SaveButton {...props.saveButtonProps} ></SaveButton>
          </>
        )} headerProps={{ extra: null }}>
        {!props.isFormLoading ? props.children : <Skeleton active />}
      </Create>
    )
  else
    return (
      <Edit
        title={<></>}
        headerButtons={<></>}
        goBack={<></>}
        breadcrumb={<></>}
        footerButtons={() => (
          <>
            <Button icon={<SnippetsOutlined />} disabled={props.isTemplateBtnDisabled} onClick={() => props.createTemplate()} type="primary">Create Template</Button>
            <SaveButton {...props.saveButtonProps} ></SaveButton>
          </>)}
        headerProps={{ extra: null }}>
        {!props.isFormLoading ? props.children : <Skeleton active />}
      </Edit>
    )
}