import * as React from "react";
import * as ReactDOM from "react-dom";

import {
  ICoreOptions,
  IProviderUserOptions,
  ThemeColors,
  getThemeColors,
  SimpleFunction
} from 'web3modal'
import {
  WEB3_CONNECT_MODAL_ID,
  CONNECT_EVENT,
  ERROR_EVENT,
  CLOSE_EVENT
} from 'web3modal'
import { themesList } from 'web3modal'
import { Modal } from './components'
import { EventController, ProviderController } from 'web3modal'

// copy-pasted and adapted
// https://github.com/Web3Modal/web3modal/blob/4b31a6bdf5a4f81bf20de38c45c67576c3249bfc/src/core/index.tsx

const INITIAL_STATE = { show: false };

const defaultOpts: ICoreOptions = {
  lightboxOpacity: 0.4,
  theme: themesList.default.name,
  cacheProvider: false,
  disableInjectedProvider: false,
  providerOptions: {},
  network: ""
};

export class Core {
  private show: boolean = INITIAL_STATE.show;
  private themeColors: ThemeColors;
  private eventController: EventController = new EventController();
  private lightboxOpacity: number;
  private providerController: ProviderController;
  private userOptions: IProviderUserOptions[];

  constructor(opts?: Partial<ICoreOptions>) {
    const options: ICoreOptions = {
      ...defaultOpts,
      ...opts
    };

    // setup theme
    this.lightboxOpacity = options.lightboxOpacity;
    this.themeColors = getThemeColors(options.theme);

    // setup provider controller
    this.providerController = new ProviderController({
      disableInjectedProvider: options.disableInjectedProvider,
      cacheProvider: options.cacheProvider,
      providerOptions: options.providerOptions,
      network: options.network
    });

    // setup modal
    this.userOptions = this.providerController.getUserOptions();
    this.renderModal();
  }

  get cachedProvider(): string {
    return this.providerController.cachedProvider;
  }

  /** opens or closes modal */
  private toggleModal = () => {
    const d = typeof window !== "undefined" ? document : ""
    const body = d ? d.body || d.getElementsByTagName("body")[0] : ""

    if (body) {
      body.style.overflow = this.show ? "" : "hidden"
    }

    return this.updateState({ show: !this.show });
  };

  private closeModalIfOpen = async () => {
    if (this.show) {
      await this.toggleModal();
    }
  }

  /** handles an event and closes modal if open */
  private handleOnAndTrigger = async (event: string, ...args: any) => this.closeModalIfOpen()
    .then(() => this.eventController.trigger(event, ...args))

  /** event handlers */
  private onClose = () => this.handleOnAndTrigger(CLOSE_EVENT)
  private onConnect = (provider: any) => this.handleOnAndTrigger(CONNECT_EVENT, provider)
  private onError = (error: any) => this.handleOnAndTrigger(ERROR_EVENT, error)

  private setupHandlers = (resolve: ((result: any) => void), reject: ((error: any) => void)) => {
    this.on(CONNECT_EVENT, provider => resolve(provider));
    this.on(ERROR_EVENT, error => reject(error));
    this.on(CLOSE_EVENT, () => reject("Modal closed by user"));
  }

  /** dangerous! gives responsibility to update modal state */
  private updateState = async (state: any) => {
    Object.keys(state).forEach(key => {
      (this as any)[key] = state[key];
    });
    await window.updateWeb3Modal(state);
  };

  private resetState = () => this.updateState({ ...INITIAL_STATE });

  /** renders the modal in DOM */
  private renderModal() {
    const el = document.createElement("div");
    el.id = WEB3_CONNECT_MODAL_ID;
    document.body.appendChild(el);

    ReactDOM.render(
      <Modal
        themeColors={this.themeColors}
        userOptions={this.userOptions}
        lightboxOpacity={this.lightboxOpacity}
        onClose={this.onClose}
        resetState={this.resetState}
        providerController={this.providerController}
        onConnect={this.onConnect}
        onError={this.onError}
      />,
      document.getElementById(WEB3_CONNECT_MODAL_ID)
    );
  }

  /**
   * Connect to rLogin. This will prompt the modal based on the
   * definitions.
   */
  public connect = (): Promise<any> =>
    new Promise(async (resolve, reject) => { // weird async, to be refactored
      this.setupHandlers(resolve, reject)

      if (this.cachedProvider) {
        await this.providerController.connectToCachedProvider();
        return;
      }

      await this.toggleModal(); // pre: the modal is closed
    });

  /**
   * Connect to rLogin with a specific wallet provider
   * @param id provider id (same of configuration)
   */
  public connectTo = (id: string): Promise<any> =>
    new Promise(async (resolve, reject) => {
      this.setupHandlers(resolve, reject)

      const provider = this.providerController.getProvider(id);

      if (!provider) return reject(`Cannot connect to provider (${id}), check provider options`)

      await this.providerController.connectTo(provider.id, provider.connector);
    });

  /**
   * Subscribe to modal event
   * @param event event name
   * @param callback event callback closure
   */
  public on(event: string, callback: SimpleFunction): SimpleFunction {
    this.eventController.on({ event, callback });

    return () => this.eventController.off({ event, callback });
  }

  /**
   * Unsubscribe from modal event
   * @param event event name
   * @param callback event callback closure
   */
  public off(event: string, callback?: SimpleFunction): void {
    this.eventController.off({ event, callback });
  }

  /**
   * Clear cached provider from local storage
   */
  public clearCachedProvider(): void {
    this.providerController.clearCachedProvider();
  }

  /**
   * Set cached provider in local storage
   * @param id provider id (same of configuration)
   */
  public setCachedProvider(id: string): void {
    this.providerController.setCachedProvider(id);
  }

  /**
   * Update theme
   * @param theme new theme
   */
  public async updateTheme(theme: string | ThemeColors): Promise<void> {
    this.themeColors = getThemeColors(theme);
    await this.updateState({ themeColors: this.themeColors });
  }
}
