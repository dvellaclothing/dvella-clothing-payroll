


export default function CardOne(props) {
    return(
        <>
            <div className="flex flex-col w-full justify-center items-start min-h-30 bg-white rounded-2xl border border-[rgba(0,0,0,0.3)] px-5 gap-2">
                <p className="text-black text-sm font-medium">{props.cardTitle}</p>
                <div className="flex flex-row items-center justify-start gap-2">
                    <p className="text-black">{props.cardValue}</p>
                    <div className="flex flex-row items-center justify-center border border-[rgba(0,0,0,0.3)] py-[2px] px-2 rounded-lg gap-1">
                        {
                            props.cardImage === "" ? null
                            : <img src={props.cardImage} alt="arrow up icon" className="h-2 w-auto" />
                        }
                        <p className="text-xs font-medium">{props.changes}</p>
                    </div>
                </div>
                <p className="text-black text-sm">{props.cardDescription}</p>
            </div>
        </>
    )
}