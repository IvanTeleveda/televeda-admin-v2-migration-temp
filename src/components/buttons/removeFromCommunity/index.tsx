import { Button, Popconfirm, Typography } from "@pankod/refine-antd";
import { useDelete } from "@refinedev/core";
import React, { JSX, useState } from "react";

export const RemovesFromCommunityButton: React.FC<{
    communityId: string,
    associationId: string,
    url: string,
    onSuccessFn: () => void,
    associationType: string,
    modalBtnIcon: JSX.Element,
    isInstructor?: boolean
}> = (props) => {

    const [secondPop, setSecondPop] = useState<boolean>(false);

    const { communityId, associationId, url, onSuccessFn, associationType, modalBtnIcon, isInstructor } = props;

    const { mutate } = useDelete();

    const onSuccess = () => {
        onSuccessFn();
    }

    const confirm = () => {

        let initiateSuccess = true

        if (isInstructor) {
            initiateSuccess = false
            setSecondPop(true)
        }

        let resource: string

        if (associationType) {
            resource = `${url}/${communityId}/${associationType}`
        }
        else {
            resource = `${url}/${communityId}`
        }

        mutate({
            resource: resource,
            id: associationId,
            //mutationMode: "optimistic",
        },
            {
                onSuccess: () => {
                    if (initiateSuccess) {
                        onSuccess()
                    }
                }
            });

    }

    const cancel = () => {

    }

    const confirmRemoveInstructor = () => {

        let resource: string

        if (associationType) {
            resource = `${url}/${communityId}/${associationType}`
        }
        else {
            resource = `${url}/${communityId}`
        }

        mutate({
            resource: `${url}/${communityId}/host`,
            id: associationId,
            //mutationMode: "optimistic",
        },
            {
                onSuccess: onSuccess
            });

        setSecondPop(false)
    }

    const cancelRemoveInstructor = () => {
        onSuccess();
        setSecondPop(false);
    }

    const PopRemoveInstructor = (): JSX.Element => {
        return (
            <Popconfirm
                defaultOpen={true}
                onOpenChange={cancelRemoveInstructor}
                title="Also remove instructor?"
                onConfirm={confirmRemoveInstructor}
                onCancel={cancelRemoveInstructor}
                okText="Yes"
                cancelText="No"
            >
                <Button danger type="default" size="small" shape="round" icon={modalBtnIcon} >
                    Remove
                </Button>
            </Popconfirm>
        )
    }

    return (
        secondPop ? <PopRemoveInstructor /> :

            <Popconfirm
                title={associationType === "host" ?
                    <Typography.Text>
                        Are you sure?
                        <br />
                        This will also remove all
                        <br />
                        instructor event associations!
                    </Typography.Text>
                    : 'Are you sure?'}
                onConfirm={confirm}
                onCancel={cancel}
                okText="Yes"
                cancelText="No"
            >
                <Button danger type="default" size="small" shape="round" icon={modalBtnIcon} >
                    Remove
                </Button>
            </Popconfirm>

    )
}
