import { Button } from '@pankod/refine-antd'
import React, { JSX, useState } from 'react'

const CopyLinkButton: React.FC<{ style?: any, btnShape: 'round' | 'default' | 'circle', code: string, icon: JSX.Element, copyURL(code: string): void}> = (props) => {

    const [copied, setCopied] = useState<boolean>(false) 
    const { copyURL, icon, code, btnShape, style } = props

    function setCopiedFalse(){
        setCopied(false)
    }

    function copyTimeOut(){
        setCopied(true)
        setTimeout(setCopiedFalse,1000)
    }

    return (
        <Button style={{ color: '#4775ff', ...style }} type="default" size="small" shape={btnShape} icon={icon}
            onClick={() => {copyURL(code); copyTimeOut()}}>
            {copied? "Link copied" : "Copy link" }
        </Button>
    )
}

export default CopyLinkButton