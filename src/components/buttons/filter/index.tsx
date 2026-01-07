import React, { forwardRef, useImperativeHandle, useState } from "react";
import { Badge, Button, Popover } from "@pankod/refine-antd";
import { CrudFilters } from "@refinedev/core";
import FilterIcon from '../../../icons/filter_icon.svg?react';
import { FilterOutlined } from "@ant-design/icons";
import { SizeType } from "antd/es/config-provider/SizeContext";


export interface IFulterButtonProps {
    filters: CrudFilters | undefined;
    title?: string;
    label?: string;
    width?: number | string;
    shape?: "default" | "circle" | "round";
    size?: SizeType,
    ref?: any;
    children: React.ReactNode;
}

export const FilterButton: React.FunctionComponent<IFulterButtonProps> = forwardRef((props, ref) => {

    const { filters, title, label, shape, size, children } = props;

    const [open, setOpen] = useState(false);

    useImperativeHandle(ref, () => ({
        hide() {
            setOpen(false);
        }
    }));

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
    };

    let appliedFiltersCount: number = 0;

    filters?.forEach(filter => {
        // console.log('filter: ', filter)
        if (!filter.value) return;
        if (filter.value instanceof String && filter.value == '') return;
        if (filter.value instanceof Array && filter.value.length < 1) return;
        appliedFiltersCount++;
    });

    return (
        <Popover
            content={
                <div style={{ maxWidth: props.width || 300 }}>
                    {children}
                </div>
            }
            title={title ? title : "Filter by"}
            trigger="click"
            open={open}
            onOpenChange={handleOpenChange}
            placement="bottomLeft"
        >
            <Badge count={appliedFiltersCount}>
                <Button
                    type="primary"
                    size={size ? size : 'middle'}
                    shape={shape === undefined ? "default" : shape}
                    style={{ paddingLeft: '20px' }}
                    icon={<FilterOutlined />}
                >
                    {label ? label : "Filter"}
                </Button>
            </Badge>
        </Popover>
    );
});