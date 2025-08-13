import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { TokenManager } from "./TokenManager"
import * as useTokenManagerModule from "../hooks/useTokenManager"

vi.mock("../hooks/useTokenManager", () => ({
  useTokenManager: vi.fn(),
}))

describe("TokenManager", () => {
  const mockToken = {
    address: "0x1234567890123456789012345678901234567890",
    decimals: 18,
    symbol: "TEST",
  }

  const mockTargetAddress = "0x0987654321098765432109876543210987654321"

  const mockUseTokenManager = {
    balance: "100",
    approvedAmount: "50",
    amount: "10",
    error: null,
    setAmount: vi.fn(),
    handleApprove: vi.fn(),
    handleTransfer: vi.fn(),
    handleMint: vi.fn(),
    isApproveLoading: false,
    isTransferLoading: false,
    isMintLoading: false,
    hasInsufficientBalance: false,
    hasInsufficientAllowance: false,
  }

  beforeEach(() => {
    vi.mocked(useTokenManagerModule.useTokenManager).mockReturnValue(mockUseTokenManager)
  })

  it("renders correctly", () => {
    render(<TokenManager token={mockToken} targetAddress={mockTargetAddress} />)

    expect(screen.getByText(mockToken.symbol)).toBeInTheDocument()
    expect(screen.getByText(/Balance:/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Amount:/)).toBeInTheDocument()
    expect(screen.getByText(/Approved for spending:/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Approve" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Transfer" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: `Mint 100 ${mockToken.symbol}` })).toBeInTheDocument()
  })

  it("calls setAmount when input changes", () => {
    render(<TokenManager token={mockToken} targetAddress={mockTargetAddress} />)

    const input = screen.getByLabelText(/Amount:/)
    fireEvent.change(input, { target: { value: "20" } })

    expect(mockUseTokenManager.setAmount).toHaveBeenCalledWith("20")
  })

  it("calls handleApprove when Approve button is clicked", () => {
    render(<TokenManager token={mockToken} targetAddress={mockTargetAddress} />)

    const approveButton = screen.getByRole("button", { name: "Approve" })
    fireEvent.click(approveButton)

    expect(mockUseTokenManager.handleApprove).toHaveBeenCalled()
  })

  it("calls handleTransfer when Transfer button is clicked", () => {
    render(<TokenManager token={mockToken} targetAddress={mockTargetAddress} />)

    const transferButton = screen.getByRole("button", { name: "Transfer" })
    fireEvent.click(transferButton)

    expect(mockUseTokenManager.handleTransfer).toHaveBeenCalled()
  })

  it("calls handleMint when Mint button is clicked", () => {
    render(<TokenManager token={mockToken} targetAddress={mockTargetAddress} />)

    const mintButton = screen.getByRole("button", { name: `Mint 100 ${mockToken.symbol}` })
    fireEvent.click(mintButton)

    expect(mockUseTokenManager.handleMint).toHaveBeenCalled()
  })

  it("displays error message when error is present", () => {
    const errorMessage = "Test error message"
    vi.mocked(useTokenManagerModule.useTokenManager).mockReturnValue({
      ...mockUseTokenManager,
      error: errorMessage,
    })

    render(<TokenManager token={mockToken} targetAddress={mockTargetAddress} />)

    expect(screen.getByText(errorMessage)).toBeInTheDocument()
  })

  it("disables buttons and shows loading indicators when loading", () => {
    vi.mocked(useTokenManagerModule.useTokenManager).mockReturnValue({
      ...mockUseTokenManager,
      isApproveLoading: true,
      isTransferLoading: true,
      isMintLoading: true,
    })

    render(<TokenManager token={mockToken} targetAddress={mockTargetAddress} />)

    const buttons = screen.getAllByRole("button")
    buttons.forEach((button) => {
      expect(button).toBeDisabled()
      expect(button.querySelector("svg.animate-spin")).toBeInTheDocument()
    })
  })
})

