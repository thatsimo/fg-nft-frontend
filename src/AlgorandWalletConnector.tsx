import * as React from "react";

import { SessionWallet, allowedWallets } from "algorand-session-wallet";

import { Dialog, Button, Classes, HTMLSelect, Intent } from "@blueprintjs/core";
import { IconName } from "@blueprintjs/icons";

type AlgorandWalletConnectorProps = {
  darkMode: boolean;
  connected: boolean;
  accts: string[];
  sessionWallet: SessionWallet;
  updateWallet(sw: SessionWallet): void;
};

export default function AlgorandWalletConnector(
  props: AlgorandWalletConnectorProps
) {
  const [selectorOpen, setSelectorOpen] = React.useState(false);
  const { sessionWallet, updateWallet } = props;
  React.useEffect(() => {
    if (sessionWallet.connected()) return;

    let interval: any;
    sessionWallet.connect().then((success) => {
      if (!success) return;

      // Check every 500ms to see if we've connected then kill the interval
      // This is most useful in the case of walletconnect where it may be several
      // seconds before the user connects
      interval = setInterval(() => {
        if (sessionWallet.connected()) {
          clearInterval(interval);
          updateWallet(sessionWallet);
        }
      }, 500);
    });

    return () => {
      clearInterval(interval);
    };
  }, [sessionWallet, updateWallet]);

  function disconnectWallet() {
    props.sessionWallet.disconnect();
    props.updateWallet(
      new SessionWallet(
        props.sessionWallet.network,
        props.sessionWallet.permissionCallback
      )
    );
  }

  function handleDisplayWalletSelection() {
    setSelectorOpen(true);
  }

  async function handleSelectedWallet(e: any) {
    const choice = e.currentTarget.id;

    if (!(choice in allowedWallets)) {
      if (props.sessionWallet.wallet !== undefined)
        props.sessionWallet.disconnect();
      return setSelectorOpen(false);
    }

    const sw = new SessionWallet(
      props.sessionWallet.network,
      props.sessionWallet.permissionCallback,
      choice
    );

    if (!(await sw.connect())) {
      sw.disconnect();
    }

    const interval = setInterval(() => {
      // If they've already connected, we wont get an on connect, have to check here
      const wc = localStorage.getItem("walletconnect");
      if (wc === null || wc === undefined || wc === "") return;

      const wcObj = JSON.parse(wc);
      const accounts = wcObj.accounts;
      if (accounts.length > 0) {
        clearInterval(interval);
        sw.setAccountList(wcObj.accounts);
        props.updateWallet(
          new SessionWallet(sw.network, sw.permissionCallback, choice)
        );
      }
    }, 250);

    props.updateWallet(sw);

    setSelectorOpen(false);
  }

  function handleChangeAccount(e: any) {
    props.sessionWallet.setAccountIndex(parseInt(e.target.value));
    props.updateWallet(props.sessionWallet);
  }

  const walletOptions = [];
  for (const [k, v] of Object.entries(allowedWallets)) {
    if (k !== "wallet-connect" && k !== "my-algo-connect") continue;

    walletOptions.push(
      <li key={k}>
        <Button
          id={k}
          large={true}
          fill={true}
          minimal={true}
          outlined={true}
          onClick={handleSelectedWallet}
        >
          <div className="wallet-option">
            <img
              alt="wallet-branding"
              className="wallet-branding"
              src={v.img(false)}
            />
            <h5>{v.displayName()}</h5>
          </div>
        </Button>
      </li>
    );
  }

  if (!props.connected)
    return (
      <div>
        <Button
          minimal={true}
          style={{ color: "white", borderColor: "white", borderRadius: "8px" }}
          rightIcon="selection"
          intent="warning"
          outlined={true}
          onClick={handleDisplayWalletSelection}
        >
          Connect
        </Button>

        <Dialog
          isOpen={selectorOpen}
          title="Select Wallet"
          onClose={handleSelectedWallet}
        >
          <div className={Classes.DIALOG_BODY}>
            <ul className="wallet-option-list">{walletOptions}</ul>
          </div>
        </Dialog>
      </div>
    );

  const addr_list = props.accts.map((addr, idx) => {
    return (
      <option value={idx} key={idx}>
        {" "}
        {addr.substr(0, 8)}...{" "}
      </option>
    );
  });

  const iconprops = {
    icon: "symbol-circle" as IconName,
    intent: "success" as Intent,
  };

  return (
    <div>
      <HTMLSelect
        style={{ color: "white" }}
        onChange={handleChangeAccount}
        minimal={true}
        iconProps={iconprops}
        defaultValue={props.sessionWallet.accountIndex()}
      >
        {addr_list}
      </HTMLSelect>
      <Button icon="log-out" minimal={true} onClick={disconnectWallet} />
    </div>
  );
}
