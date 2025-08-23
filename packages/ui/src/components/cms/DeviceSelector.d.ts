interface Props {
    deviceId: string;
    orientation: "portrait" | "landscape";
    setDeviceId: (id: string) => void;
    toggleOrientation: () => void;
}
export default function DeviceSelector({ deviceId, orientation, setDeviceId, toggleOrientation, }: Props): React.JSX.Element;
export {};
//# sourceMappingURL=DeviceSelector.d.ts.map