import React, { useEffect } from "react";
import { SessionWallet } from "algorand-session-wallet";
import AlgorandWalletConnector from "./AlgorandWalletConnector";
import {
  Alignment,
  AnchorButton,
  Button,
  Callout,
  Card,
  Classes,
  Dialog,
  Elevation,
  Navbar,
  ProgressBar,
} from "@blueprintjs/core";
import { collect, conf, getAsaId, getNFT, sendWait } from "./lib/algorand";
import {
  BrowserView,
  isIOS,
  isMobileSafari,
  MobileView,
} from "react-device-detect";
import { useSearchParams } from "react-router-dom";

function App() {
  const sw = new SessionWallet(conf.network);
  const [sessionWallet, setSessionWallet] = React.useState(sw);
  const [nft, setNFT] = React.useState({
    id: -1,
    url: "fg-default.png",
    name: "fg-default",
  });
  const [accts, setAccounts] = React.useState(sw.accountList());
  const [connected, setConnected] = React.useState(sw.connected());
  const [claimable, setClaimable] = React.useState(true);
  const [claimed, setClaimed] = React.useState(false);

  const [loading, setLoading] = React.useState(false);
  const [signed, setSigned] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const [searchParams] = useSearchParams();
  const escrow = searchParams.get("escrow");
  const addr = searchParams.get("addr");
  const secret = searchParams.get("secret")?.replaceAll(" ", "+");

  useEffect(() => {
    setClaimable(secret !== null && addr !== null && escrow !== null);
    if (escrow !== null)
      getAsaId(escrow)
        .then((nftId) => {
          getNFT(nftId).then((nft) => setNFT(nft));
        })
        .catch((error) => {
          void error;
        });
  }, [escrow, addr, secret]);

  const updateWallet = (sw: SessionWallet) => {
    setSessionWallet(sw);
    setAccounts(sw.accountList());
    setConnected(sw.connected());
  };

  const triggerHelp = () => {
    setOpen(false);
    setLoading(false);
    document.getElementById("help-text")?.click();
  };

  const handleDownload = async () => {
    const a = document.createElement("a");
    const image = await fetch(nft.url);
    const imageBlog = await image.blob();
    a.href = URL.createObjectURL(imageBlog);
    a.download = nft.name;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCollect = async () => {
    if (
      secret === null ||
      secret === undefined ||
      addr === null ||
      escrow === null
    ) {
      return;
    }

    setLoading(true);
    setOpen(true);

    try {
      const asaId = await getAsaId(escrow);
      const txn_group = await collect(sw, asaId, escrow, addr, secret);

      setSigned(true);

      getNFT(asaId).then((nft) => {
        setNFT(nft);
      });

      await sendWait(txn_group);

      setClaimable(false);
      setClaimed(true);
    } catch (error) {
      const e = error as Error;
      if (e.message.includes("overspend")) {
        alert("This account doe not have enough Algos to claim.");
      } else {
        alert("Something went wrong: " + error);
      }
    } finally {
      setOpen(false);
      setLoading(false);
    }
  };

  let message = (
    <div>
      <h3> Greetings Folks!</h3>
      <p>Connect your wallet and collect your NFT.</p>
    </div>
  );

  let buttons = (
    <Button
      style={{
        color: "white",
        borderColor: "white",
        borderRadius: "8px",
        width: "100%",
        marginTop: "8px",
      }}
      minimal={true}
      outlined={true}
      intent="success"
      large={true}
      icon="circle"
      text="Collect"
      onClick={handleCollect}
      disabled={!connected || !claimable}
      loading={loading}
    />
  );

  if (nft.id !== 0 && claimed) {
    buttons = (
      <div>
        <Button
          style={{
            color: "white",
            borderColor: "white",
            borderRadius: "8px",
            margin: "8px",
          }}
          minimal={true}
          outlined={true}
          intent="success"
          large={true}
          icon="download"
          text="Download"
          onClick={handleDownload}
        />
        <AnchorButton
          style={{
            color: "white",
            borderColor: "white",
            borderRadius: "8px",
            margin: "8px",
          }}
          minimal={true}
          outlined={true}
          large={true}
          intent="success"
          href={"https://www.nftexplorer.app/asset/" + nft.id}
          target="_blank"
        >
          <img
            style={{ width: "20px", float: "left", marginRight: "8px" }}
            alt="nft explorer icon"
            src="nftexplorer.ico"
          />
          NFT Explorer
        </AnchorButton>
      </div>
    );

    message = (
      <div>
        <h3> Congrats on successfully collecting your FOLKSY GUYS NFT! </h3>
        <p>
          Enjoy it as a commemorative token that you’ve earned by being part of
          the Folks Finance community and completing the testnet task.
        </p>
        <p>
          <b>Note: </b>If the image of your Folksy Guy isn't appearing yet, give
          it a moment, it might be shy
        </p>
      </div>
    );
  }

  return (
    <div className="App" style={{ background: "#11131e" }}>
      <Navbar style={{ background: "#11131e" }}>
        <Navbar.Group align={Alignment.LEFT}>
          <Navbar.Heading>
            <a
              href="https://folks.finance"
              target="_blank"
              className="header__logo"
              aria-label="Folks Finance main page"
              rel="noreferrer"
            >
              <svg
                className="header__logo-image"
                viewBox="0 0 125 36"
                fill="none"
                color="white"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12.913.802c2.493 2.492 5.011 5.61 7.803 7.755 1.248.957 2.66 1.415 4.525.439.022.012.024-.141 0 0l-4.156 4.155a3.45 3.45 0 0 1-4.866 0L8.667 5.598C5.638 2.57 10.292-1.82 12.913.802ZM24.19.544a3.737 3.737 0 1 0-.004 7.474A3.737 3.737 0 0 0 24.19.544ZM22.693 34.803c-2.493-2.492-5.01-5.612-7.805-7.753-1.246-.958-2.657-1.417-4.523-.44-.021 0-.023.143 0 0l4.156-4.156a3.449 3.449 0 0 1 4.864 0l7.563 7.553c3.028 3.03-1.626 7.418-4.247 4.796h-.008Zm-11.278.258a3.735 3.735 0 1 0 0-7.47 3.735 3.735 0 0 0 0 7.47ZM34.803 12.92c-2.494 2.492-5.61 5.01-7.755 7.8-.958 1.248-1.415 2.66-.438 4.525-.01.021.142.023 0 0l-4.158-4.156a3.453 3.453 0 0 1 0-4.864l7.555-7.553c3.028-3.03 7.418 1.626 4.796 4.247Zm.258 11.275a3.736 3.736 0 1 0-.283 1.426 3.74 3.74 0 0 0 .283-1.43v.004ZM.802 22.692c2.492-2.492 5.61-5.01 7.753-7.803.959-1.248 1.417-2.659.44-4.524.01-.022-.142-.022 0 0l4.156 4.155a3.451 3.451 0 0 1 0 4.866l-7.553 7.553c-3.03 3.028-7.417-1.625-4.796-4.247ZM.554 11.416a3.735 3.735 0 1 0 7.47-.004 3.735 3.735 0 0 0-7.47.004Z"
                  fill="currentColor"
                />
                <path
                  d="M43.311 21.192a.992.992 0 0 1-.992-.992V7.164a.962.962 0 0 1 .616-.934.992.992 0 0 1 .384-.068h8.704a.992.992 0 0 1 .713.26.91.91 0 0 1 .27.684.862.862 0 0 1-.27.655 1.006 1.006 0 0 1-.713.25h-7.71v4.67h5.525a.992.992 0 0 1 .715.26.958.958 0 0 1 0 1.33.99.99 0 0 1-.715.26h-5.524v5.66a.992.992 0 0 1-1.003.993v.008ZM66.731 21.384a8.192 8.192 0 0 1-3.1-.567 7.05 7.05 0 0 1-2.416-1.588 7.268 7.268 0 0 1-1.57-2.447 8.93 8.93 0 0 1 0-6.209 7.293 7.293 0 0 1 1.57-2.435 7.056 7.056 0 0 1 2.417-1.6 8.722 8.722 0 0 1 6.19 0 7.112 7.112 0 0 1 3.996 4.035 8.93 8.93 0 0 1 0 6.21 7.075 7.075 0 0 1-3.997 4.044 8.12 8.12 0 0 1-3.09.557Zm0-1.81a5.755 5.755 0 0 0 2.302-.452 5.508 5.508 0 0 0 3.003-3.13 6.747 6.747 0 0 0 0-4.659 5.534 5.534 0 0 0-1.19-1.877 5.436 5.436 0 0 0-1.819-1.243 6.204 6.204 0 0 0-4.602 0c-.682.284-1.299.708-1.81 1.243a5.72 5.72 0 0 0-1.19 1.877 6.602 6.602 0 0 0 0 4.66 5.68 5.68 0 0 0 1.19 1.877 5.41 5.41 0 0 0 1.81 1.252c.73.308 1.515.462 2.306.453ZM82.72 21.192a.94.94 0 0 1-.704-.288.99.99 0 0 1-.278-.712V7.164a.965.965 0 0 1 .287-.713.948.948 0 0 1 .695-.29.992.992 0 0 1 .992.993V19.19h6.971a1.001 1.001 0 1 1 0 2.002H82.72ZM99.324 21.192a.993.993 0 0 1-.705-.288.955.955 0 0 1-.297-.712V7.164a.95.95 0 0 1 .297-.713.993.993 0 0 1 1.406.001.989.989 0 0 1 .291.702v5.777l6.382-6.362c.121-.13.264-.238.423-.318a.993.993 0 0 1 .397-.087.79.79 0 0 1 .692.29.891.891 0 0 1 .155.682 1.322 1.322 0 0 1-.365.722l-4.912 4.93 5.023 6.806a1 1 0 0 1 .198.703 1.093 1.093 0 0 1-.269.635.777.777 0 0 1-.616.26.943.943 0 0 1-.827-.423l-4.872-6.604-1.389 1.39v4.64a.993.993 0 0 1-.992.993l-.02.004ZM119.585 21.384A7.174 7.174 0 0 1 117.24 21a6.055 6.055 0 0 1-1.945-1.077 4.227 4.227 0 0 1-1.213-1.6.759.759 0 0 1 0-.75 1.061 1.061 0 0 1 1.368-.337c.224.123.403.316.51.55.179.35.44.654.76.885.387.287.82.508 1.28.654a4.971 4.971 0 0 0 1.587.25 4.874 4.874 0 0 0 1.705-.287 3.041 3.041 0 0 0 1.26-.838c.325-.376.498-.861.482-1.359a2.543 2.543 0 0 0-.209-.995 2.545 2.545 0 0 0-.585-.833c-.529-.54-1.405-.87-2.627-.992-1.588-.152-2.839-.62-3.755-1.405a3.681 3.681 0 0 1-1.375-2.923 3.323 3.323 0 0 1 .713-2.157 4.402 4.402 0 0 1 1.934-1.348 7.624 7.624 0 0 1 2.725-.464 5.847 5.847 0 0 1 2.05.328 4.86 4.86 0 0 1 1.532.904c.445.397.828.858 1.135 1.368.166.23.245.51.222.794a.787.787 0 0 1-.375.595.903.903 0 0 1-.794.097 1.079 1.079 0 0 1-.635-.5 3.436 3.436 0 0 0-.752-.945 3.367 3.367 0 0 0-1.039-.607 4.052 4.052 0 0 0-1.405-.22 4.605 4.605 0 0 0-2.382.53 1.812 1.812 0 0 0-.964 1.684c.001.39.105.771.299 1.108.265.41.647.729 1.098.915.529.256 1.296.436 2.3.538 1.528.154 2.718.617 3.572 1.389.853.77 1.28 1.794 1.282 3.07a3.85 3.85 0 0 1-.453 1.907c-.299.537-.714 1-1.214 1.357a5.36 5.36 0 0 1-1.727.83 7.47 7.47 0 0 1-2.02.27ZM42.297 30.977a.317.317 0 0 1-.316-.317v-5.721a.312.312 0 0 1 .09-.229.306.306 0 0 1 .226-.089h3.816a.315.315 0 0 1 .228.085.296.296 0 0 1 .09.225.293.293 0 0 1-.09.212.307.307 0 0 1-.228.09h-3.489v2.244h2.548a.308.308 0 0 1 .318.31.312.312 0 0 1-.195.288.305.305 0 0 1-.123.02h-2.547v2.563a.31.31 0 0 1-.09.224.297.297 0 0 1-.238.095ZM55.436 30.977a.305.305 0 0 1-.316-.317v-5.721a.311.311 0 0 1 .09-.228.334.334 0 0 1 .454 0 .314.314 0 0 1 .09.228v5.72a.306.306 0 0 1-.318.317v.002ZM65.248 30.977a.306.306 0 0 1-.318-.317v-5.721a.31.31 0 0 1 .09-.229.308.308 0 0 1 .228-.083.298.298 0 0 1 .242.115l3.89 5.108V24.94a.306.306 0 0 1 .317-.318.316.316 0 0 1 .294.194c.016.039.024.081.023.124v5.719a.302.302 0 0 1-.093.228.316.316 0 0 1-.224.09.38.38 0 0 1-.131-.024.234.234 0 0 1-.106-.082l-3.895-5.11v4.898a.296.296 0 0 1-.093.228.31.31 0 0 1-.224.091ZM78.843 30.978a.278.278 0 0 1-.268-.155.321.321 0 0 1-.016-.3l2.381-5.68a.314.314 0 0 1 .31-.22.307.307 0 0 1 .3.22l2.4 5.688a.291.291 0 0 1-.019.3.295.295 0 0 1-.266.147.33.33 0 0 1-.175-.048.353.353 0 0 1-.125-.147l-2.238-5.427h.252l-2.24 5.423a.315.315 0 0 1-.296.199Zm.538-1.513.244-.545h3.302l.244.545h-3.79ZM92.779 30.977a.306.306 0 0 1-.317-.317v-5.721a.31.31 0 0 1 .089-.229.326.326 0 0 1 .472.026l3.89 5.108V24.94a.31.31 0 0 1 .193-.297.304.304 0 0 1 .122-.021.31.31 0 0 1 .224.09.3.3 0 0 1 .094.228v5.719a.297.297 0 0 1-.094.228.31.31 0 0 1-.224.09.376.376 0 0 1-.129-.025.228.228 0 0 1-.107-.08l-3.895-5.11v4.897a.298.298 0 0 1-.096.228.307.307 0 0 1-.222.091ZM109.58 31.057a3.024 3.024 0 0 1-1.234-.252 3.169 3.169 0 0 1-1.008-.703 3.327 3.327 0 0 1-.679-1.041 3.404 3.404 0 0 1 0-2.523 3.248 3.248 0 0 1 1.683-1.742c.391-.172.815-.26 1.242-.256a3.19 3.19 0 0 1 1.066.17c.339.126.653.311.927.546a.201.201 0 0 1 .057.059.234.234 0 0 1 .008.221.196.196 0 0 1-.097.104.143.143 0 0 1-.03.057.143.143 0 0 1-.051.04.27.27 0 0 1-.151.024.311.311 0 0 1-.167-.074 2.16 2.16 0 0 0-.692-.41 2.58 2.58 0 0 0-.87-.134 2.33 2.33 0 0 0-.992.21 2.62 2.62 0 0 0-.81.578 2.71 2.71 0 0 0 0 3.743c.23.243.505.438.81.573.313.137.651.205.992.199.289.001.575-.049.846-.147.272-.1.527-.244.756-.423a.264.264 0 0 1 .198-.065c.075.01.145.043.199.097a.28.28 0 0 1 .081.212.312.312 0 0 1-.02.117.371.371 0 0 1-.069.112 2.407 2.407 0 0 1-.927.54c-.345.11-.705.167-1.068.168ZM120.863 30.977a.304.304 0 0 1-.296-.194.29.29 0 0 1-.021-.123v-5.721a.324.324 0 0 1 .021-.124.33.33 0 0 1 .068-.105.311.311 0 0 1 .228-.089h3.817a.315.315 0 0 1 .295.187c.016.039.024.08.022.123 0 .04-.008.08-.025.116a.276.276 0 0 1-.07.096.307.307 0 0 1-.222.09h-3.499v2.244h2.546a.31.31 0 1 1 0 .619h-2.546v2.27h3.499a.308.308 0 0 1 .222.09.27.27 0 0 1 .07.094.271.271 0 0 1 .025.116.287.287 0 0 1-.095.224.316.316 0 0 1-.222.085l-3.817.002Z"
                  fill="currentColor"
                />
              </svg>
            </a>
          </Navbar.Heading>
        </Navbar.Group>
        <Navbar.Group align={Alignment.RIGHT}>
          <AlgorandWalletConnector
            darkMode={true}
            sessionWallet={sessionWallet}
            accts={accts}
            connected={connected}
            updateWallet={updateWallet}
          />
        </Navbar.Group>
      </Navbar>
      <div className="container">
        <Card elevation={Elevation.FOUR} className="ticket-card">
          <div className="content">
            <div className="content-piece">
              <img alt="NFT" className="gator" src={nft.url} />
            </div>
            <div className="content-details">
              <div className="detail-prose" style={{ color: "white" }}>
                {message}
              </div>
              <div className="collect-button">{buttons}</div>
            </div>
          </div>
        </Card>
      </div>
      <div className="container">
        <HelpDropdown />
      </div>
      <ClaimDialog triggerHelp={triggerHelp} open={open} signed={signed} />
      <SafariBugFixDialog />
    </div>
  );
}

function HelpDropdown() {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <div className="help-container">
      <Button
        id="help-text"
        icon="help"
        minimal={true}
        intent="primary"
        style={{ color: "white", borderColor: "white", borderRadius: "8px" }}
        outlined={true}
        onClick={() => setIsOpen(true)}
      >
        Need Help?
      </Button>
      <Dialog
        isOpen={isOpen}
        canEscapeKeyClose={true}
        canOutsideClickClose={true}
        isCloseButtonShown={true}
        onClose={() => setIsOpen(false)}
      >
        <div className="container">
          <div className="help-text">
            <p style={{ color: "#000 !important" }}>
              <h3>How to collect your Folksy Guy</h3>
              <p>
                First, you will need to download the{" "}
                <a href="https://algorandwallet.com/">Algorand Wallet</a>
                (make sure you have the <b>latest version</b>) and load it with
                at least 0.3 Algo.
              </p>

              <p>
                Second, click the “Connect” button on the top right of this page
                and proceed as follows
              </p>

              <MobileView>
                <ul>
                  <li>
                    A pop-up will appear with the toggle on “Mobile” -- Choose
                    the account you wish to use -- Click “Connect”
                  </li>
                  <li>
                    Return to the landing page on your mobile browser. Your
                    Algorand Wallet address should now appear on the top right
                    corner of the page
                  </li>
                  <li>
                    Click “Collect” on the web page in your mobile browser, and
                    then switch to the wallet App to “Approve” the transaction
                  </li>
                </ul>
              </MobileView>
              <BrowserView>
                <ul>
                  <li>
                    Scan the QR code using the scanner within your mobile
                    Algorand Wallet{" "}
                  </li>
                  <li>
                    A pop-up will appear within the mobile app -- Choose the
                    account you wish to use -- Click “Connect”
                  </li>
                  <li>
                    At this point, your Algorand Wallet address will appear on
                    the top right corner of the desktop landing page
                  </li>
                  <li>
                    Click “Collect” on the web page, and then “Approve” the
                    transaction within your mobile wallet
                  </li>
                </ul>
              </BrowserView>

              <p>
                Once approved and the transaction is processed, your unique 1/1
                Folksy Guy NFT asset will appear on this page and within your
                mobile Algorand wallet. (Note that the Algorand Wallet will show
                the Asset Name and Asset ID, not an actual image of the
                NFT...yet).
              </p>

              <p>
                <b>Not working? </b> Try turning the mobile app off and on
                again. Also please check your App Store to ensure your Algorand
                Mobile Wallet is updated to the latest version.
              </p>
              <p>
                <b>Still not working?</b> During testing we noticed some issues
                when the entire processes is done using Mobile Safari. If you're
                having issues on mobile, please try to access the link from a
                desktop browser.
              </p>
            </p>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function SafariBugFixDialog() {
  const [isOpen] = React.useState(isMobileSafari);
  return (
    <Dialog
      isOpen={isOpen}
      style={{ background: "lightgray" }}
      isCloseButtonShown={true}
    >
      <div className={Classes.DIALOG_BODY}>
        <h3>Hi! It looks like you're visiting from a mobile browser on iOS.</h3>
        <p>
          Unfortunately there is an experimental setting enabled by default on
          iOS that breaks the network connections with the mobile wallet.
        </p>
        <p>
          <b>Current options:</b>
        </p>
        <ul>
          <li>
            <p>
              Disable the setting as described
              <a
                rel="noreferrer"
                target="_blank"
                href="https://developer.apple.com/forums/thread/685403?answerId=689525022#689525022"
              >
                here
              </a>
            </p>
            <Callout>
              <p>Safari Settings</p>
              <p>{"->Advanced"}</p>
              <p>{"-->Experimental Features"}</p>
              <p>{"---->NSURLSession WebSocket to off"}</p>
            </Callout>
          </li>
          <li>Or visit this site on a desktop browser</li>
        </ul>
      </div>
    </Dialog>
  );
}

interface ClaimDialogProps {
  open: boolean;
  signed: boolean;
  triggerHelp(): void;
}

function ClaimDialog(props: ClaimDialogProps) {
  const [isOpen, setIsOpen] = React.useState(props.open);
  const [signed, setSigned] = React.useState(props.signed);
  const [progress, setProgress] = React.useState(0);

  const handleClose = React.useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    setIsOpen(props.open);
    setSigned(props.signed);
  }, [props]);

  useEffect(() => {
    let p = 0;
    if (!signed || progress > 0 || progress >= 1.0) return;

    // "fake" timer just to give enough time to submit txn and
    // have it confirmed on the network, then load the NFT details
    const step = 100 / (6 * 1000);
    const interval = setInterval(() => {
      p += step;
      if (p > 1.0) {
        clearInterval(interval);
        setProgress(1.0);
        return;
      }
      setProgress(p);
    }, 100);
  }, [signed, progress]);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      style={{ background: "lightgray" }}
    >
      <div className={Classes.DIALOG_BODY}>
        {!signed ? (
          <div className="container">
            <div className="container">
              <p>
                <b>Please Approve the transaction in your Mobile Wallet. </b>
              </p>
              <MobileView>
                <AnchorButton
                  style={{ borderRadius: "8px", margin: "20px 0px -30px" }}
                  text="Take me there"
                  href={
                    isIOS
                      ? "algorand-wc://wc?uri=wc:00e46b69-d0cc-4b3e-b6a2-cee442f97188@1"
                      : "wc:00e46b69-d0cc-4b3e-b6a2-cee442f97188@1"
                  }
                  intent="success"
                  large={true}
                  minimal={true}
                  outlined={true}
                  rightIcon="double-chevron-right"
                />
              </MobileView>
            </div>
            <div className="container">
              <Button
                style={{ borderRadius: "4px", margin: "40px 0px -50px" }}
                minimal={true}
                outlined={true}
                onClick={props.triggerHelp}
                intent="warning"
                text="Having Issues?"
              />
            </div>
          </div>
        ) : (
          <ProgressBar animate={true} intent="success" value={progress} />
        )}
      </div>
    </Dialog>
  );
}

export default App;
