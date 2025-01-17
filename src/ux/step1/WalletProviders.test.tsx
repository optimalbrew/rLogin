// eslint-disable-next-line
import React from 'react'
import { mount } from 'enzyme'
import { WalletProviders } from './WalletProviders'
import { PROVIDERS_FOOTER_TEXT_CLASSNAME, PROVIDERS_WRAPPER_CLASSNAME } from '../../constants/cssSelectors'

describe('Component: WalletProviders', () => {
  const providers = [
    { name: 'test1', logo: 'test1.jpg', description: 'description1', onClick: jest.fn() },
    { name: 'test2', logo: 'test2.jpg', description: 'description2', onClick: jest.fn() }
  ]

  it('renders and is defined', () => {
    const wrapper = mount(<WalletProviders userProviders={providers} />)
    expect(wrapper).toBeDefined()
  })

  it('shows header and footer', () => {
    const wrapper = mount(<WalletProviders userProviders={providers} />)
    expect(wrapper.find('h2').text()).toBe('Connect your wallet')
    expect(wrapper.find(`p.${PROVIDERS_FOOTER_TEXT_CLASSNAME}`).text()).toEqual('No wallet? Get one here!')
  })

  it('shows multiple providers', () => {
    const wrapper = mount(<WalletProviders userProviders={providers} />)
    expect(wrapper.find(`div.${PROVIDERS_WRAPPER_CLASSNAME}`).children()).toHaveLength(2)

    expect(wrapper.find(`div.${PROVIDERS_WRAPPER_CLASSNAME}`).childAt(0).find('h3').text()).toEqual('test1')
    expect(wrapper.find(`div.${PROVIDERS_WRAPPER_CLASSNAME}`).childAt(1).find('h3').text()).toEqual('test2')
  })
})
