"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { themes } from "@/registry/themes"

export function ThemeCustomizer() {
  const [open, setOpen] = React.useState(false)
  const { theme, setTheme } = useTheme()

  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  const [radius, setRadius] = React.useState("1.0")
  const [color, setColor] = React.useState("blue")

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[340px]">
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-2">
            <h3 className="font-medium">Color</h3>
            <div className="grid grid-cols-3 gap-2">
              {["zinc", "red", "rose", "orange", "green", "blue", "yellow", "violet"].map((c) => (
                <Button
                  key={c}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setColor(c)
                    document.documentElement.style.setProperty("--radius", radius + "rem")
                  }}
                  className={`justify-start gap-2 ${color === c ? "border-2 border-primary" : ""}`}
                >
                  <div className={`h-4 w-4 rounded-full bg-${c}-500`} />
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="font-medium">Radius</h3>
            <div className="grid grid-cols-5 gap-2">
              {["0", "0.3", "0.5", "0.75", "1.0"].map((r) => (
                <Button
                  key={r}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRadius(r)
                    document.documentElement.style.setProperty("--radius", r + "rem")
                  }}
                  className={radius === r ? "border-2 border-primary" : ""}
                >
                  {r}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="font-medium">Mode</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTheme("light")}
                className={theme === "light" ? "border-2 border-primary" : ""}
              >
                <Sun className="mr-2 h-4 w-4" />
                Light
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTheme("dark")}
                className={theme === "dark" ? "border-2 border-primary" : ""}
              >
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </Button>
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

