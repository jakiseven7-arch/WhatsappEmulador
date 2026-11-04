package com.example.clicker;
import com.android.uiautomator.core.UiObject;
import com.android.uiautomator.core.UiObjectNotFoundException;
import com.android.uiautomator.core.UiSelector;
import com.android.uiautomator.testrunner.UiAutomatorTestCase;

public class Clicker extends UiAutomatorTestCase {
    public void testClickSend() throws UiObjectNotFoundException {
        UiObject btn = new UiObject(new UiSelector().resourceId("com.whatsapp:id/send"));
        if (btn.exists()) {
            btn.click();
            System.out.println("CLICKED send");
        } else {
            System.out.println("send button not found");
        }
    }
}
